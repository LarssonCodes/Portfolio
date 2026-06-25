/* ===================================================
   LARSSON PORTFOLIO — AI FEATURES
   Handles: Chat Bubble, Pitch Analyzer, Typing Bio,
            Project Insights, CV Generator
   Depends on: ai-config.js (loaded first)
   =================================================== */

/* ─── SHARED SYSTEM CONTEXT ─────────────────────── */
const LARSSON_CONTEXT = `
You are Nimbus, an AI assistant representing Larsson Lalremtluanga — a Data Science MSc student, mobile app developer, and AI intern from Mizoram, India.
Speak warmly and honestly on his behalf. Always speak in the third person when referring to Larsson (use "he/him/his", e.g., "Larsson is..." or "He built Nova because..."). Never pretend to be Larsson himself. Never speak in the first person as Larsson or say "I am Larsson". If asked who you are, say: "I am Nimbus, Larsson's AI assistant."
Be conversational, enthusiastic, and concise (2-4 sentences unless more detail is asked for).

━━━ WHO LARSSON IS ━━━
Full name: Larsson Lalremtluanga. Goes by "Larsson".
From: Mizoram, India.
He is someone who genuinely enjoys building and learning through code — he loves the feeling of turning an idea into something that works exactly as he imagined. He's always looking to improve his skills and take on new challenges. Intermediate level overall, still actively growing.

━━━ EDUCATION ━━━
Currently pursuing an MSc in Data Science (ongoing).

━━━ WORK EXPERIENCE ━━━
AI Intern at LushAITech (current) — LushAITech is an AI software company that develops intelligent solutions and language technologies for businesses and organizations. As an AI intern, Larsson helps prepare and clean language datasets to improve the accuracy of AI models the company develops.

━━━ SKILLS ━━━
Strong skills in: React Native, Python / ML, Web development (HTML/CSS/JS), Firebase & Backend, UI/UX Design, Kotlin / Android.
Data science tools: Pandas, NumPy, Scikit-Learn, Matplotlib, Streamlit (basic-intermediate level, actively learning).
Other tools: Firebase, Expo, Git, VS Code, Android Studio, Google Colab.

━━━ INTERESTS & PASSION AREAS ━━━
Most passionate about: Data Science & Analytics, AI & Machine Learning, Mobile App Development (React Native), Full-Stack Web.
Career goal: Aiming for a data science or AI research role after finishing his MSc.

━━━ PERSONALITY & HOBBIES ━━━
Outside coding, Larsson loves playing musical instruments and gaming. He's a builder at heart — the kind of person who can't stop making things, even when it gets messy. Nothing in his portfolio is perfect, but everything is built honestly to solve real problems.

━━━ PROJECTS ━━━

1. ILA — React Native · Firebase · Razorpay · (In Progress)
   The REAL story: "ILA" is Mizo slang for "Let's go / Let's do it" — no deeper meaning, just energy.
   This is Larsson's most ambitious current project. It's a gig platform built specifically for Mizoram's music scene — a place where bands and solo performers can find gigs, and venues/organizers can discover talent. The vision is to make gigging a real, viable profession in Mizoram, not just a hobby. Think of it like a local Gig economy app — performers can list themselves, venues can post opportunities, and bookings happen through the app with Razorpay payments.
   It's NOT a church app or community events app — it's a music gig platform.
   Status: Still in active development, not public yet. Larsson is building it because he genuinely believes musicians in Mizoram deserve a real platform.
   Tech: React Native (frontend), Firebase (real-time backend, auth, database), Razorpay (payments).

2. Nova — React Native · React Native Skia · 2025
   The REAL story: Larsson built this entirely for himself because he wanted a habit tracker that actually felt interesting to use, not just another streak counter with checkboxes.
   The concept: your habits are mapped onto an interactive human anatomy model. Track your workout habit → the muscles you train light up. Track your sleep, hydration, meditation — different parts of the body respond. Built using React Native Skia for the custom graphics and animations.
   Status: Personal project, built as a prototype/concept for personal use. It works and Larsson actually uses it.
   Tech: React Native, React Native Skia (for the anatomy graphics), custom animations.

3. Spam Filter (Gmail) — Python · Scikit-Learn · Gmail API
   The REAL story: This was a college machine learning assignment/project for his MSc Data Science program.
   What it does: Connects to a Gmail account via the Gmail API, scans emails, and classifies them as spam or not using a Naive Bayes model trained with Scikit-Learn. It also does smart sorting — not just spam detection but organizing emails into categories.
   Honest context: This is a college project, not a commercial product. But it's a solid demonstration of ML fundamentals — data cleaning, feature engineering, model training, and API integration all in one project.
   Tech: Python, Scikit-Learn (Naive Bayes classifier), Gmail API, Pandas.

4. INBAWK Cards — React Native · Expo · Firebase
   The REAL story: INBAWK is a real card game played in Mizoram — a local favorite. Larsson built the digital version because he genuinely loves the game AND because he wanted to learn Firebase real-time features properly. Two motivations at once.
   What makes it special: It's a real-time multiplayer game — multiple players join a room and play simultaneously, with game state synced live via Firebase. The aesthetic is intentionally premium, like a high-end casino app, which is a deliberate design choice to make a local game feel world-class.
   Status: Complete and working.
   Tech: React Native, Expo, Firebase (Realtime Database for live multiplayer sync).

He also works on many smaller side projects and experiments regularly — always building something.

━━━ CONTACT ━━━
General contact: lrtlarsson@gmail.com
Important/professional contact: larssonlrt@gmail.com
GitHub: https://github.com/LarssonCodes
LinkedIn: https://www.linkedin.com/in/larsson-lalremtluanga-b53796379/

━━━ AVAILABILITY ━━━
Currently doing an internship at LushAITech. If someone asks about collaboration or freelance, say he's focused on his internship and studies right now but is always interested in hearing about interesting opportunities — they should reach out at larssonlrt@gmail.com.

━━━ RULES FOR YOU ━━━
- Keep responses short and conversational unless asked for detail.
- Do not make up information not listed above.
- If asked something you don't know, say you're not sure but Larsson can answer directly at larssonlrt@gmail.com.
- Be warm, genuine, and represent Larsson authentically — not like a corporate bot.
- Always refer to Larsson in the third person (he/him/his). Never say "I am Larsson" or speak in the first person as Larsson.
- If asked who you are, introduce yourself as Nimbus, Larsson's AI assistant.
- If a user has a question for Larsson, wants to get in touch, or wants to send him a message/email:
  1. Offer to send an email to Larsson directly on their behalf.
  2. Ask for their name, their email address, and their message.
  3. Explicitly tell them they can write the message in any language they prefer (e.g. English, Mizo, etc.).
  4. Once you have their name, email, and message, invoke the 'sendEmailToLarsson' tool to send it.
`;

function formatMarkdown(text) {
  if (!text) return '';
  // Simple HTML escaping to prevent XSS
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  // Replace **bold** with <strong>bold</strong>
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace *italic* or _italic_ with <em>italic</em>
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace line breaks with <br>
  safe = safe.replace(/\n/g, '<br>');
  
  return safe;
}


/* ═══════════════════════════════════════════════════
   FEATURE 1 — AI CHAT BUBBLE
   ═══════════════════════════════════════════════════ */
function initAIChat() {
  const bubble     = document.getElementById('ai-chat-bubble');
  const panel      = document.getElementById('ai-chat-panel');
  const closeBtn   = document.getElementById('ai-chat-close');
  const input      = document.getElementById('ai-chat-input');
  const sendBtn    = document.getElementById('ai-chat-send');
  const messages   = document.getElementById('ai-chat-messages');
  const toggleLabel = document.getElementById('ai-chat-toggle-label');

  if (!bubble || !panel) return;

  let chatHistory = [];
  let isOpen = false;

  // Suggested questions
  const SUGGESTIONS = [
    "What's Larsson's best project?",
    "What tech stack does he use?",
    "Is he open to freelance?",
    "Tell me about the Spam Filter",
  ];

  function renderSuggestions() {
    const el = document.createElement('div');
    el.className = 'ai-suggestions';
    SUGGESTIONS.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'ai-suggestion-chip';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        input.value = q;
        el.remove();
        sendMessage();
      });
      el.appendChild(btn);
    });
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text, isStreaming = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-msg ai-msg-${role}`;

    if (role === 'model') {
      const avatar = document.createElement('div');
      avatar.className = 'ai-msg-avatar';
      avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      wrapper.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble';
    if (isStreaming) bubble.classList.add('streaming');

    const p = document.createElement('p');
    p.innerHTML = formatMarkdown(text);
    bubble.appendChild(p);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
    return p; // return p so we can stream into it
  }

  // ── TOOL DECLARATIONS ────────────────────────────
  const AI_TOOLS = [{
    functionDeclarations: [
      {
        name: 'scrollToSection',
        description: 'Smoothly scrolls the portfolio page to a named section when the user asks to see it.',
        parameters: {
          type: 'OBJECT',
          properties: {
            section: {
              type: 'STRING',
              enum: ['home', 'work', 'about', 'contact', 'pitch'],
              description: 'The section id to scroll to',
            },
          },
          required: ['section'],
        },
      },
      {
        name: 'highlightProject',
        description: 'Scrolls to the work section and spotlights a specific project slide with a glow effect.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: {
              type: 'STRING',
              enum: ['ila', 'nova', 'spam', 'inbawk'],
              description: 'Which project to highlight',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'openProjectCaseStudy',
        description: 'Navigates to the full case study page for a project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: {
              type: 'STRING',
              enum: ['ila', 'anatomypro', 'spam-remover', 'inbawk'],
              description: 'The project id used in the URL',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'sendEmailToLarsson',
        description: "Sends an email message directly to Larsson with the user's name, email, and their question/message. The message can be written in Mizo, English, or any other language they prefer.",
        parameters: {
          type: 'OBJECT',
          properties: {
            senderName: {
              type: 'STRING',
              description: 'The name of the user/visitor sending the message.',
            },
            senderEmail: {
              type: 'STRING',
              description: 'The email address of the user/visitor so Larsson can reply.',
            },
            message: {
              type: 'STRING',
              description: 'The message, question, or inquiry the user wants to send to Larsson (in any language).',
            },
          },
          required: ['senderName', 'senderEmail', 'message'],
        },
      },
    ],
  }];

  // ── ACTION EXECUTOR ──────────────────────────────
  const PROJECT_SLIDE_INDEX = { ila: 0, nova: 1, spam: 2, inbawk: 3 };

  function executePortfolioAction(name, args) {
    if (name === 'scrollToSection') {
      const target = document.getElementById(args.section) ||
                     document.querySelector(`[id="${args.section}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return `Scrolled to the ${args.section} section.`;
    }

    if (name === 'highlightProject') {
      const idx   = PROJECT_SLIDE_INDEX[args.projectId] ?? 0;
      const work  = document.getElementById('work');
      if (work) {
        const targetY = work.getBoundingClientRect().top + window.scrollY + idx * window.innerHeight;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      // Spotlight glow after scroll lands
      setTimeout(() => {
        const slideId = `project-${args.projectId === 'spam' ? 'spam' : args.projectId}`;
        const box = document.querySelector(`#${slideId} .project-visual-box`);
        if (box) {
          box.classList.add('project-spotlight');
          setTimeout(() => box.classList.remove('project-spotlight'), 2400);
        }
      }, 900);
      return `Highlighted the ${args.projectId} project.`;
    }

    if (name === 'openProjectCaseStudy') {
      setTimeout(() => {
        window.location.href = `project.html?id=${args.projectId}`;
      }, 1200);
      return `Opening case study for ${args.projectId}.`;
    }

    if (name === 'sendEmailToLarsson') {
      // 1. Send email via Web3Forms
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: "aa77608e-a63c-48f0-9fed-de7c2277de18",
          subject: `New Inquiry from ${args.senderName} (via Portfolio Chat)`,
          from_name: "Nimbus (AI Assistant)",
          name: args.senderName,
          email: args.senderEmail,
          message: args.message
        })
      })
      .catch(err => console.error("AI sendEmailToLarsson fetch failed:", err));

      // 2. Save to Firebase
      if (window.saveContactMessageToFirebase) {
        window.saveContactMessageToFirebase({
          name: args.senderName,
          email: args.senderEmail,
          message: args.message
        });
      }

      return `Message successfully sent to Larsson's email from ${args.senderName} (${args.senderEmail}).`;
    }

    return 'Action completed.';
  }

  // ── ACTION CHIP (shown in chat when an action fires) ─
  function addActionChip(name, args) {
    const labels = {
      scrollToSection:    `↗ Navigating to ${args.section}`,
      highlightProject:   `✦ Spotlighting ${args.projectId.toUpperCase()} project`,
      openProjectCaseStudy: `→ Opening case study…`,
      sendEmailToLarsson: `✉ Sending email to Larsson…`,
    };
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-action-chip-wrapper';
    wrapper.innerHTML = `<span class="ai-action-chip">${labels[name] || '⚡ Action triggered'}</span>`;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    document.querySelector('.ai-suggestions')?.remove();
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<span class="ai-send-spinner"></span>`;

    addMessage('user', text);
    chatHistory.push({ role: 'user', parts: [{ text }] });

    try {
      // ── Step 1: call Gemini with tool declarations ──
      const raw = await window.GeminiAI.geminiWithTools(
        'gemini-flash-lite-latest',
        [...chatHistory],
        LARSSON_CONTEXT,
        AI_TOOLS
      );

      const candidate  = raw.candidates?.[0];
      const parts      = candidate?.content?.parts || [];
      const fnCallPart = parts.find(p => p.functionCall);
      const textPart   = parts.find(p => p.text);

      if (fnCallPart) {
        // ── Function call path ──────────────────────
        const { name, args } = fnCallPart.functionCall;

        // Execute the UI action + show chip
        const actionResult = executePortfolioAction(name, args);
        addActionChip(name, args);

        // Build the follow-up conversation including the function result
        // We MUST pass the original model parts array to preserve the thoughtSignature
        const followUpHistory = [
          ...chatHistory,
          { role: 'model',  parts: parts },
          { role: 'user',   parts: [{ functionResponse: { name, response: { result: actionResult } } }] },
        ];

        // ── Step 2: stream the final text explanation ──
        const responseEl = addMessage('model', '', true);
        let fullText = '';
        await window.GeminiAI.geminiStream(
          'gemini-flash-lite-latest',
          followUpHistory,
          LARSSON_CONTEXT,
          (chunk) => {
            fullText += chunk;
            responseEl.innerHTML = formatMarkdown(fullText);
            messages.scrollTop = messages.scrollHeight;
          }
        );
        responseEl.closest('.ai-msg-bubble').classList.remove('streaming');
        
        // Push the full tool call sequence to main chat history to maintain context
        chatHistory.push({ role: 'model', parts: parts });
        chatHistory.push({ role: 'user', parts: [{ functionResponse: { name, response: { result: actionResult } } }] });
        chatHistory.push({ role: 'model', parts: [{ text: fullText }] });

      } else if (textPart) {
        // ── Plain text path — display streamed response ─
        // Re-stream via a dedicated streaming call for proper typewriter effect
        const responseEl = addMessage('model', '', true);
        let fullText = '';
        await window.GeminiAI.geminiStream(
          'gemini-flash-lite-latest',
          [...chatHistory],
          LARSSON_CONTEXT,
          (chunk) => {
            fullText += chunk;
            responseEl.innerHTML = formatMarkdown(fullText);
            messages.scrollTop = messages.scrollHeight;
          }
        );
        responseEl.closest('.ai-msg-bubble').classList.remove('streaming');
        chatHistory.push({ role: 'model', parts: [{ text: fullText }] });

      } else {
        addMessage('model', 'Hmm, something went wrong. Try again!');
      }

    } catch (err) {
      const errEl = addMessage('model', '');
      errEl.textContent = err.message === 'ALL_QUOTA_EXHAUSTED'
        ? 'All AI keys are out of quota for today. Come back tomorrow! 🌙'
        : 'Hmm, something went wrong. Try again in a moment!';
      errEl.closest('.ai-msg-bubble').classList.remove('streaming');
    }

    input.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    input.focus();
  }

  // Toggle panel
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('active', isOpen);
    if (isOpen && messages.children.length === 0) {
      addMessage('model', "Hey! 👋 I'm Nimbus, Larsson's AI assistant. Ask me anything about his work, skills, or projects!");
      setTimeout(renderSuggestions, 300);
    }
  });

  closeBtn?.addEventListener('click', () => {
    isOpen = false;
    panel.classList.remove('open');
    bubble.classList.remove('active');
  });

  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Pulse animation hint after 3s
  setTimeout(() => {
    if (!isOpen) bubble.classList.add('pulse');
    setTimeout(() => bubble.classList.remove('pulse'), 4000);
  }, 3000);

  // Show saying bubble hint automatically after 3.5s
  let hintTimeout = setTimeout(() => {
    if (!isOpen && toggleLabel) {
      toggleLabel.classList.add('show-hint');
    }
  }, 3500);

  // Auto-hide saying bubble hint after 8 seconds of showing (11.5s total)
  let hideHintTimeout = setTimeout(() => {
    if (toggleLabel) {
      toggleLabel.classList.remove('show-hint');
    }
  }, 11500);

  function dismissHint() {
    clearTimeout(hintTimeout);
    clearTimeout(hideHintTimeout);
    if (toggleLabel) {
      toggleLabel.classList.remove('show-hint');
    }
  }

  // Dismiss hint bubble on user interaction
  bubble.addEventListener('mouseenter', dismissHint);
  bubble.addEventListener('click', dismissHint);
}


/* ═══════════════════════════════════════════════════
   FEATURE 2 — AI PITCH ANALYZER
   ═══════════════════════════════════════════════════ */
function initPitchAnalyzer() {
  const form       = document.getElementById('pitch-form');
  const submitBtn  = form?.querySelector('.form-submit');
  const statusEl   = document.getElementById('pitch-status');
  const resultCard = document.getElementById('ai-pitch-result');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name  = document.getElementById('pitch-name')?.value.trim();
    const email = document.getElementById('pitch-email')?.value.trim();
    const idea  = document.getElementById('pitch-idea')?.value.trim();

    if (!name || !email || !idea) return;

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="ai-send-spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:#fff;"></span> Analyzing with AI...`;
    }

    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.innerHTML = `
        <div class="pitch-result-loading">
          <div class="pitch-result-orb"></div>
          <p>Gemini is analyzing your idea<span class="dot-anim">...</span></p>
        </div>`;
    }

    const prompt = `
Analyze this app idea pitch briefly and enthusiastically. Be concise (under 120 words total).
Return ONLY valid JSON like this:
{
  "score": 85,
  "emoji": "🚀",
  "verdict": "One exciting sentence verdict",
  "stack": "Recommended tech stack (3-5 items)",
  "timeline": "Rough timeline estimate",
  "insight": "One sharp technical insight"
}

Pitch from ${name}:
"${idea}"
    `.trim();

    try {
      const raw = await window.GeminiAI.geminiGenerate(
        'gemini-flash-lite-latest',
        [{ role: 'user', parts: [{ text: prompt }] }]
      );

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const result = JSON.parse(jsonMatch[0]);

      if (resultCard) {
        resultCard.innerHTML = `
          <div class="pitch-result-header">
            <span class="pitch-result-emoji">${result.emoji}</span>
            <div>
              <div class="pitch-result-score-bar">
                <div class="pitch-result-score-fill" style="width: ${result.score}%"></div>
              </div>
              <p class="pitch-result-score-label">Feasibility Score: <strong>${result.score}/100</strong></p>
            </div>
          </div>
          <p class="pitch-result-verdict">${result.verdict}</p>
          <div class="pitch-result-meta">
            <div class="pitch-result-meta-item">
              <span class="pitch-meta-label">Suggested Stack</span>
              <span class="pitch-meta-value">${result.stack}</span>
            </div>
            <div class="pitch-result-meta-item">
              <span class="pitch-meta-label">Est. Timeline</span>
              <span class="pitch-meta-value">${result.timeline}</span>
            </div>
          </div>
          <p class="pitch-result-insight">💡 ${result.insight}</p>
          <p class="pitch-result-footer">Analysis sent to Larsson — he'll be in touch at <strong>${email}</strong></p>
        `;
      }

      // Also fire to Firebase if it exists
      if (window.submitPitchToFirebase) {
        window.submitPitchToFirebase({ name, email, idea, aiScore: result.score });
      }

    } catch (err) {
      if (resultCard) {
        resultCard.innerHTML = `<p class="pitch-result-error">AI analysis failed, but your pitch was saved! Larsson will review it manually.</p>`;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Pitch ↗';
    }
  });
}


/* ═══════════════════════════════════════════════════
   FEATURE 3 — CYCLING TYPING BIO (Hero)
   ═══════════════════════════════════════════════════ */
function initTypingBio() {
  const el = document.getElementById('hero-typing-bio');
  if (!el) return;

  const bios = [
    "Currently pursuing an MSc in Data Science.\n\nThis is where I showcase my projects, experiments, and everything I'm building along the way.",
    "Building at the intersection of mobile and machine learning.\n\nEvery project here started as a problem worth solving.",
    "Data scientist by study, app developer by passion.\n\nHere's a collection of things I've built and learned from.",
    "From Naive Bayes classifiers to React Native apps — this is what happens when curiosity meets code.",
    "MSc Data Science student who can't stop shipping.\n\nExploring AI, mobile, and everything in between.",
  ];

  let bioIndex = Math.floor(Math.random() * bios.length);
  let charIndex = 0;
  let isDeleting = false;
  let isWaiting = false;

  function type() {
    const current = bios[bioIndex];

    if (!isDeleting && charIndex <= current.length) {
      el.textContent = current.slice(0, charIndex);
      charIndex++;
      setTimeout(type, charIndex < 3 ? 80 : 28);
    } else if (!isDeleting && charIndex > current.length) {
      isWaiting = true;
      setTimeout(() => {
        isWaiting = false;
        isDeleting = true;
        type();
      }, 4200);
    } else if (isDeleting && charIndex > 0) {
      el.textContent = current.slice(0, charIndex);
      charIndex--;
      setTimeout(type, 14);
    } else {
      isDeleting = false;
      bioIndex = (bioIndex + 1) % bios.length;
      charIndex = 0;
      setTimeout(type, 400);
    }
  }

  // Small delay so page loads first
  setTimeout(type, 800);
}





/* ═══════════════════════════════════════════════════
   FEATURE 5 — AI CV GENERATOR
   ═══════════════════════════════════════════════════ */
function initCVGenerator() {
  const btn   = document.getElementById('ai-cv-btn');
  const modal = document.getElementById('ai-cv-modal');
  const closeBtn = document.getElementById('ai-cv-close');
  const form  = document.getElementById('ai-cv-form');
  const output = document.getElementById('ai-cv-output');
  const copyBtn = document.getElementById('ai-cv-copy');

  if (!btn || !modal) return;

  btn.addEventListener('click', () => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(output?.textContent || '');
    copyBtn.textContent = 'Copied! ✓';
    setTimeout(() => copyBtn.textContent = 'Copy to Clipboard', 2000);
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jobDesc = document.getElementById('cv-job-desc')?.value.trim();
    if (!jobDesc) return;

    const generateBtn = form.querySelector('.cv-generate-btn');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating…';
    }

    if (output) {
      output.innerHTML = `<div class="cv-loading"><div class="pitch-result-orb"></div><p>Tailoring your CV<span class="dot-anim">...</span></p></div>`;
      output.classList.add('visible');
    }
    if (copyBtn) copyBtn.style.display = 'none';

    const prompt = `
Write a tailored, professional 1-page CV summary for Larsson Lalremtluanga specifically for this job description.
Highlight only the most relevant skills and projects. Use clean plain text formatting with sections.
Make it sound like a real, polished CV — not a template.

About Larsson:
${LARSSON_CONTEXT}

Job Description:
"${jobDesc}"

Output a complete CV text with sections: Summary, Skills, Projects, Education. Plain text only, no markdown symbols.
    `.trim();

    try {
      let fullCV = '';
      if (output) output.textContent = '';
      if (copyBtn) copyBtn.style.display = 'none';

      await window.GeminiAI.geminiStream(
        'gemini-flash-lite-latest',
        [{ role: 'user', parts: [{ text: prompt }] }],
        '',
        (chunk) => {
          fullCV += chunk;
          if (output) {
            output.textContent = fullCV;
            output.scrollTop = output.scrollHeight;
          }
        }
      );

      if (copyBtn) {
        copyBtn.style.display = 'block';
        copyBtn.textContent = 'Copy to Clipboard';
      }
    } catch {
      if (output) output.textContent = 'Generation failed. Please try again.';
    }

    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate CV ↗';
    }
  });
}


/* ═══════════════════════════════════════════════════
   INIT ALL FEATURES
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTypingBio();
  initPitchAnalyzer();
  initCVGenerator();

  const bubble = document.getElementById('ai-chat-bubble');
  const label  = document.getElementById('ai-chat-toggle-label');
  if (bubble && label) {
    if (!window.GeminiAI.allKeysExhausted()) {
      bubble.classList.add('ready');
      label.classList.add('ready');
      initAIChat();
    }
  }

  window.addEventListener('gemini-quota-exhausted', () => {
    const bubble = document.getElementById('ai-chat-bubble');
    const label  = document.getElementById('ai-chat-toggle-label');
    const panel  = document.getElementById('ai-chat-panel');
    if (bubble) bubble.classList.remove('ready');
    if (label) label.classList.remove('ready');
    if (panel) panel.classList.remove('open');
  });
});
