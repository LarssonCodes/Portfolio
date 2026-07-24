import { GoogleGenerativeAI } from '@google/generative-ai';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const charCount = document.getElementById('char-count');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-languages');
    const clearBtn = document.getElementById('clear-btn');
    
    const loaderSingle = document.getElementById('loader-single');
    const loaderText = document.getElementById('loader-text');
    const engineStatus = document.getElementById('engine-status');
    const statusCard = document.getElementById('status-card');
    const outputTitle = document.getElementById('output-title');
    
    const sourceLangLabel = document.getElementById('source-lang-label');
    const targetLangLabel = document.getElementById('target-lang-label');
    const copyBtnSingle = document.getElementById('copy-btn-single');

    // Modals & Settings
    const settingsToggle = document.getElementById('settings-toggle');
    const apiModal = document.getElementById('api-modal');
    const apiModalClose = document.getElementById('api-modal-close');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const geminiKeyInput = document.getElementById('gemini-key-input');

    // State
    let currentDirection = 'm2e';
    let localServerOnline = false;
    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    const MAX_CHARS = 1000;

    if (geminiApiKey) {
        geminiKeyInput.value = geminiApiKey;
    }

    // --- Status Check ---
    async function checkModelStatus() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/status');
            if (!response.ok) throw new Error('Offline');
            const data = await response.json();
            if (data.status === 'ready') {
                localServerOnline = true;
                statusCard.classList.remove('fallback');
                statusCard.classList.add('loaded');
                engineStatus.textContent = `Local Server: Active (${data.engine})`;
                outputTitle.textContent = "Translation (Fine-tuned Local Model)";
            }
        } catch (error) {
            localServerOnline = false;
            if (geminiApiKey) {
                statusCard.classList.remove('fallback');
                statusCard.classList.add('loaded');
                statusCard.style.borderColor = '#4f46e5'; // Indigo border for Gemini mode
                engineStatus.textContent = 'Browser Mode: Active (Gemini API)';
                outputTitle.textContent = "Translation (Pure Gemini API)";
            } else {
                statusCard.classList.add('fallback');
                engineStatus.textContent = 'Local Engine Offline — Configure API Fallback';
                outputTitle.textContent = "Translation Output";
            }
        }
        lucide.createIcons();
    }
    checkModelStatus();
    setInterval(checkModelStatus, 8000); // Check status occasionally

    // --- Modal Handlers ---
    settingsToggle.addEventListener('click', () => {
        apiModal.style.display = 'flex';
    });
    apiModalClose.addEventListener('click', () => {
        apiModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === apiModal) apiModal.style.display = 'none';
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = geminiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', key);
        geminiApiKey = key;
        apiModal.style.display = 'none';
        checkModelStatus();
    });

    // --- Character Counting ---
    sourceText.addEventListener('input', () => {
        const len = sourceText.value.length;
        charCount.textContent = `${len} / ${MAX_CHARS}`;
        if (len > MAX_CHARS) {
            sourceText.value = sourceText.value.substring(0, MAX_CHARS);
        }
    });

    // --- Clear Action ---
    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
        charCount.textContent = `0 / ${MAX_CHARS}`;
        sourceText.focus();
    });

    // --- Copy to Clipboard ---
    if (copyBtnSingle) {
        copyBtnSingle.addEventListener('click', () => {
            const val = targetText.value.trim();
            if (!val || val.startsWith('Error:') || val.startsWith('To try it out')) return;
            
            navigator.clipboard.writeText(val).then(() => {
                const originalHtml = copyBtnSingle.innerHTML;
                copyBtnSingle.innerHTML = '<i data-lucide="check"></i>';
                copyBtnSingle.style.color = '#10b981'; // Green
                lucide.createIcons();
                
                setTimeout(() => {
                    copyBtnSingle.innerHTML = originalHtml;
                    copyBtnSingle.style.color = '';
                    lucide.createIcons();
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        });
    }

    // --- Language Swap ---
    swapBtn.addEventListener('click', () => {
        if (currentDirection === 'm2e') {
            currentDirection = 'e2m';
            sourceLangLabel.textContent = 'English';
            targetLangLabel.textContent = 'Mizo';
            sourceText.placeholder = 'Type English text here...';
        } else {
            currentDirection = 'm2e';
            sourceLangLabel.textContent = 'Mizo';
            targetLangLabel.textContent = 'English';
            sourceText.placeholder = 'Type Mizo text here...';
        }
        const oldSource = sourceText.value;
        const oldTarget = targetText ? targetText.value : '';
        sourceText.value = oldTarget;
        if (targetText) targetText.value = oldSource;
    });

    // --- Translation Execution ---
    async function performTranslation() {
        const text = sourceText.value.trim();
        if (!text) return;

        translateBtn.disabled = true;
        translateBtn.style.opacity = '0.7';
        loaderSingle.style.display = 'flex';
        targetText.value = '';

        if (localServerOnline) {
            // Translate via Local FastAPI Server
            try {
                loaderText.textContent = "RUNNING LORA INFERENCE...";
                const response = await fetch('http://127.0.0.1:8000/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, direction: currentDirection })
                });
                if (!response.ok) throw new Error('API error');
                const data = await response.json();
                targetText.value = data.translated_text;
            } catch (error) {
                targetText.value = `Error: ${error.message}`;
            } finally {
                loaderSingle.style.display = 'none';
                translateBtn.disabled = false;
                translateBtn.style.opacity = '';
            }
        } else {
            // Offline: Translate via in-browser Gemini API key
            if (!geminiApiKey) {
                targetText.value = "To try out custom translations, please start your local NLLB translator server, or click 'Configure Live API Fallback' (settings gear icon) in the header to enter a Gemini API Key and run it inside your browser!";
                loaderSingle.style.display = 'none';
                translateBtn.disabled = false;
                translateBtn.style.opacity = '';
                return;
            }

            try {
                loaderText.textContent = "CALLING IN-BROWSER GEMINI...";
                const ai = new GoogleGenerativeAI(geminiApiKey);
                const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

                const srcLang = currentDirection === 'm2e' ? 'Mizo' : 'English';
                const tgtLang = currentDirection === 'm2e' ? 'English' : 'Mizo';

                const prompt = `You are a professional bilingual Mizo and English translator. Translate the following ${srcLang} text to ${tgtLang}. Do not write explanations, notes, or quotes. Output ONLY the translated text.
Text to translate: "${text}"`;

                const result = await model.generateContent(prompt);
                targetText.value = result.response.text().trim();
            } catch (error) {
                console.error("Gemini browser client error:", error);
                targetText.value = `Browser Translation Error: ${error.message}`;
            } finally {
                loaderSingle.style.display = 'none';
                translateBtn.disabled = false;
                translateBtn.style.opacity = '';
            }
        }
    }

    translateBtn.addEventListener('click', performTranslation);
    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            performTranslation();
        }
    });
});
