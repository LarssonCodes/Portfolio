document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const charCount = document.getElementById('char-count');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-languages');
    const clearBtn = document.getElementById('clear-btn');
    
    const loaderSingle = document.getElementById('loader-single');
    const engineStatus = document.getElementById('engine-status');
    const statusCard = document.querySelector('.model-status-card');
    
    const sourceLangLabel = document.getElementById('source-lang-label');
    const targetLangLabel = document.getElementById('target-lang-label');

    // Actions
    const copyBtnSingle = document.getElementById('copy-btn-single');
    const correctBtn = document.getElementById('correct-btn');
    const saveDbBtn = document.getElementById('save-db-btn');

    // State
    let currentDirection = 'm2e';
    const MAX_CHARS = 1000;

    // --- Status Check ---
    async function checkModelStatus() {
        try {
            const response = await fetch('/api/status');
            if (!response.ok) throw new Error('Status check failed');
            const data = await response.json();
            if (data.status === 'ready') {
                statusCard.classList.remove('fallback');
                statusCard.classList.add('loaded');
                engineStatus.textContent = `${data.engine} [${data.device.toUpperCase()}]`;
            }
        } catch (error) {
            console.error('Status check error:', error);
            statusCard.classList.add('fallback');
            engineStatus.textContent = 'Server offline';
        }
    }
    checkModelStatus();

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

    // --- Copy to Clipboard Utility ---
    function setupCopyButton(btn, textElement) {
        if (!btn || !textElement) return;
        btn.addEventListener('click', () => {
            const val = textElement.value.trim();
            if (!val || val.startsWith('Error:')) return;
            
            navigator.clipboard.writeText(val).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check"></i>';
                btn.style.color = '#10b981'; // Green
                lucide.createIcons();
                
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.style.color = '';
                    lucide.createIcons();
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        });
    }
    setupCopyButton(copyBtnSingle, targetText);

    // --- Edit / Correct Translation Logic (Feedback Loop) ---
    let isEditing = false;
    correctBtn.addEventListener('click', async () => {
        const sourceVal = sourceText.value.trim();
        if (!sourceVal) {
            alert("Please enter a source sentence first before correcting.");
            return;
        }

        if (!isEditing) {
            // Start editing mode
            isEditing = true;
            targetText.readOnly = false;
            targetText.focus();
            targetText.classList.add('editing-active');
            
            correctBtn.innerHTML = '<i data-lucide="check"></i>';
            correctBtn.title = "Save Correction";
            correctBtn.style.color = '#fbbf24'; // Warning yellow
            lucide.createIcons();
        } else {
            const targetVal = targetText.value.trim();
            if (!targetVal) {
                alert("Translation cannot be empty.");
                return;
            }

            // Save correction
            isEditing = false;
            targetText.readOnly = true;
            targetText.classList.remove('editing-active');
            loaderSingle.style.display = 'flex';
            
            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source_text: sourceVal,
                        corrected_text: targetVal,
                        direction: currentDirection
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Feedback submission failed');
                }

                correctBtn.innerHTML = '<i data-lucide="check-check"></i>';
                correctBtn.style.color = '#34d399'; // Green success
                correctBtn.title = "Saved successfully!";
                lucide.createIcons();

                await performTranslation();

                setTimeout(() => {
                    correctBtn.innerHTML = '<i data-lucide="pencil"></i>';
                    correctBtn.style.color = '';
                    correctBtn.title = "Edit/Correct translation";
                    lucide.createIcons();
                }, 3000);

            } catch (error) {
                console.error("Feedback error:", error);
                alert(`Error saving correction: ${error.message}`);
                
                correctBtn.innerHTML = '<i data-lucide="pencil"></i>';
                correctBtn.style.color = '';
                lucide.createIcons();
            } finally {
                loaderSingle.style.display = 'none';
            }
        }
    });

    // --- Save to Database Action (Add directly to RAG index) ---
    saveDbBtn.addEventListener('click', async () => {
        const sourceVal = sourceText.value.trim();
        const targetVal = targetText.value.trim();
        if (!sourceVal || !targetVal) {
            alert("No translation available to save to the database.");
            return;
        }

        saveDbBtn.disabled = true;
        saveDbBtn.style.opacity = '0.5';

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_text: sourceVal,
                    corrected_text: targetVal,
                    direction: currentDirection
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to save to database');
            }

            saveDbBtn.style.color = '#34d399'; // green success
            saveDbBtn.innerHTML = '<i data-lucide="check-circle-2"></i>';
            saveDbBtn.title = "Saved to Database!";
            lucide.createIcons();

            await performTranslation();

            setTimeout(() => {
                saveDbBtn.style.color = '';
                saveDbBtn.innerHTML = '<i data-lucide="database"></i>';
                saveDbBtn.disabled = false;
                saveDbBtn.style.opacity = '';
                lucide.createIcons();
            }, 3000);

        } catch (error) {
            console.error("Save database error:", error);
            alert(`Error saving to database: ${error.message}`);
            saveDbBtn.disabled = false;
            saveDbBtn.style.opacity = '';
        }
    });

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
        
        // Clean swap of text values (without automatic translation trigger)
        const oldSource = sourceText.value;
        const oldTarget = targetText ? targetText.value : '';
        
        sourceText.value = oldTarget;
        if (targetText) {
            targetText.value = oldSource;
        }
    });

    // --- Translation Execution ---
    async function performTranslation() {
        const text = sourceText.value.trim();
        if (!text) return;

        translateBtn.disabled = true;
        translateBtn.style.opacity = '0.7';
        loaderSingle.style.display = 'flex';
        targetText.value = '';

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, direction: currentDirection })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'API error');
            }
            const data = await response.json();
            targetText.value = data.translated_text;
            lucide.createIcons();
        } catch (error) {
            targetText.value = `Error: ${error.message}`;
        } finally {
            loaderSingle.style.display = 'none';
            translateBtn.disabled = false;
            translateBtn.style.opacity = '';
        }
    }

    // Translate Button click
    translateBtn.addEventListener('click', performTranslation);

    // Ctrl+Enter shortcut
    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            performTranslation();
        }
    });
});
