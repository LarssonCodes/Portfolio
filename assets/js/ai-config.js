/* ===================================================
   LARSSON PORTFOLIO — GEMINI AI CONFIGURATION
   ===================================================
   Paste your 7 Google AI Studio API keys below.
   All features share this key pool via round-robin
   rotation — no single key gets rate-limited.
   =================================================== */

const GEMINI_KEYS = [
  atob('QVEuQWI4Uk42SldVamR2bjNpSk96SnByMXJvWnJ2eTFDOEpPUGZER084MWt1bUh1WlhBaWc='),
  atob('QVEuQWI4Uk42Sng2WE9GTWdqTEJLVlNkS0VMSjBYSG4xM21RRXJ4S2VwazNEbl9kSnI2SWc='),
  atob('QVEuQWI4Uk42TDRaS2dPcmhDNjVUZ1hHSEdzMEhjZ1VucjlKanpHdjZtbG9qbmZmNkRZVFE='),
  atob('QVEuQWI4Uk42SkF0aWxHOFdpdTlyc0lva1N2MElQbE84TEpKR2pxczA1Y2ZwMmt4SllyUVE='),
  atob('QVEuQWI4Uk42S1hQTmp3NUdPRHBMWE1Vb2E2SVVNTlNfYUYtWS11N0c2SXpBY1FvbnowbHc='),
  atob('QVEuQWI4Uk42THdBUWZVUGFKX2xIVFJ0LTFSWGRnM0RGZkdyQ3dCdS14R1lQUTcxdnVDQVE='),
  atob('QVEuQWI4Uk42SnpIYU5ReFVjejNZQzBVZGEwU0hOcDdXZ2trX0JpOTBCNk5MV3UyYTBiN1E='),
];

let _keyIndex = 0;
const _exhaustedKeys = new Set();

/** True when every key has hit its quota */
function allKeysExhausted() {
  return _exhaustedKeys.size >= GEMINI_KEYS.length;
}

/** Marks a key as quota-exhausted so it gets skipped */
function markKeyExhausted(key) {
  _exhaustedKeys.add(key);
  if (allKeysExhausted()) {
    // Fire a global event so the UI can react
    window.dispatchEvent(new CustomEvent('gemini-quota-exhausted'));
  }
}

/**
 * Returns the next available (non-exhausted) API key.
 * Throws 'ALL_QUOTA_EXHAUSTED' if none are left.
 */
function getNextKey() {
  if (allKeysExhausted()) throw new Error('ALL_QUOTA_EXHAUSTED');
  let attempts = 0;
  while (attempts < GEMINI_KEYS.length) {
    const key = GEMINI_KEYS[_keyIndex % GEMINI_KEYS.length];
    _keyIndex++;
    attempts++;
    if (!_exhaustedKeys.has(key)) return key;
  }
  throw new Error('ALL_QUOTA_EXHAUSTED');
}

/** Base URL for Gemini generateContent */
function geminiUrl(model, key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

/** Base URL for Gemini streamGenerateContent */
function geminiStreamUrl(model, key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
}

/**
 * One-shot Gemini call. Returns response text.
 * @param {string} model  - e.g. 'gemini-2.0-flash-lite'
 * @param {Array}  parts  - array of {role, parts:[{text}]} messages
 * @param {string} systemPrompt - optional system instruction text
 */
async function geminiGenerate(model, messages, systemPrompt = '') {
  if (allKeysExhausted()) throw new Error('ALL_QUOTA_EXHAUSTED');
  const key = getNextKey();
  const body = {
    contents: messages,
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
  };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  const res = await fetch(geminiUrl(model, key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 429 || res.status === 503) {
    markKeyExhausted(key);
    // Retry with next available key
    return geminiGenerate(model, messages, systemPrompt);
  }
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Streaming Gemini call. Calls onChunk(text) for each streamed chunk.
 * @param {string}   model
 * @param {Array}    messages
 * @param {string}   systemPrompt
 * @param {Function} onChunk - called with each text chunk
 */
async function geminiStream(model, messages, systemPrompt = '', onChunk) {
  if (allKeysExhausted()) throw new Error('ALL_QUOTA_EXHAUSTED');
  const key = getNextKey();
  const body = {
    contents: messages,
    generationConfig: { temperature: 0.9, maxOutputTokens: 512 },
  };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  const res = await fetch(geminiStreamUrl(model, key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 429 || res.status === 503) {
    markKeyExhausted(key);
    // Retry with next available key
    return geminiStream(model, messages, systemPrompt, onChunk);
  }
  if (!res.ok) throw new Error(`Gemini stream error ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6).trim();
        if (json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) onChunk(chunk);
        } catch {}
      }
    }
  }
}


/**
 * Gemini call with tool/function declarations.
 * Returns the full raw API response (not just text) so the caller
 * can read both text parts and functionCall parts.
 * @param {string} model
 * @param {Array}  messages
 * @param {string} systemPrompt
 * @param {Array}  tools  - array of { functionDeclarations: [...] }
 */
async function geminiWithTools(model, messages, systemPrompt = '', tools = []) {
  if (allKeysExhausted()) throw new Error('ALL_QUOTA_EXHAUSTED');
  const key = getNextKey();
  const body = {
    contents: messages,
    tools,
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
  };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  const res = await fetch(geminiUrl(model, key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 429 || res.status === 503) {
    markKeyExhausted(key);
    return geminiWithTools(model, messages, systemPrompt, tools);
  }
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  return await res.json(); // full response — caller inspects candidates
}

window.GeminiAI = {
  getNextKey, geminiGenerate, geminiStream,
  geminiWithTools, allKeysExhausted, markKeyExhausted,
};
