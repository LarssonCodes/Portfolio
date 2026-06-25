/* ════════════════════════════════════════════
   LARSSON PORTFOLIO — MAIN JS
   ════════════════════════════════════════════ */

import { db, auth, googleProvider } from './firebase-config.js';
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc, query, writeBatch, where, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ─── Constants & State ───────────────────────
const VISIT_COUNT_KEY = 'portfolio_visit_count';
const SESSION_TRACKED_KEY = 'portfolio_session_tracked';

const projectsData = {
    'ila': {
        title: 'ILA COMMUNITY',
        windowTitle: 'ILA_SOURCE.APK',
        tagline: 'An event management and community platform for the Mizo people — built with real-time sync and secure payments.',
        platform: 'Android / iOS',
        type: 'Community App',
        stack: 'React Native',
        image: 'assets/images/icon.png',
        description: 'ILA Community is a dedicated event management and engagement platform for the Mizo community. It serves as a central hub for cultural events, local news, and community support systems.',
        tags: ['React Native', 'Firebase', 'Razorpay', 'Leaflet Maps'],
        features: [
            'Real-time event notification system',
            'Secure payment integration via Razorpay',
            'Interactive location tagging with Leaflet Maps',
            'User profiles with tiered permissions',
            'Community-led event moderation'
        ],
        technical: 'Built using React Native for cross-platform efficiency. The backend leverages Firebase Realtime Database for instant synchronization across devices. Payments are handled via OAuth-secured Razorpay hooks, and geographical data is visualized using the Leaflet.js ecosystem.',
        screenshots: [],
        github: 'https://github.com/LarssonCodes',
        apk: '#'
    },
    'anatomypro': {
        title: 'NOVA',
        windowTitle: 'NOVA_SYSTEM.EXE',
        tagline: 'Habit tracking reimagined — see your discipline reflected on an interactive anatomy model in real time.',
        platform: 'Android / iOS',
        type: 'Health & Productivity',
        stack: 'React Native + Skia',
        image: 'assets/images/anatomy_pulse.png',
        description: 'NOVA maps daily habits to a 2D anatomy model. As you build consistency, different muscle groups and organs glow — making growth visible and motivating.',
        tags: ['React Native', 'TypeScript', 'Skia', 'SVG Animation', 'Async Storage'],
        features: [
            'Interactive SVG anatomy model with dynamic color tinting',
            'Custom goal-to-bodypart mapping algorithm',
            'Real-time analytics for physical habit consistency',
            'Privacy-first — all data stays local on device',
            'Custom positioning tool for precise overlay alignment'
        ],
        technical: 'The core engine uses React Native Skia for high-performance SVG manipulation. A custom coordinate mapping system ensures overlays align perfectly across different screen sizes. State is managed through Context API + persistent local storage.',
        screenshots: [
            { src: 'assets/images/projects/nova_dashboard.jpg', caption: 'NOVA_DASHBOARD: Visual overview of habit progress.' },
            { src: 'assets/images/projects/nova_tasks.jpg', caption: 'HABIT_CALENDAR: Monthly tracking view.' },
            { src: 'assets/images/projects/nova_analytics_2.jpg', caption: 'PERFORMANCE_VELOCITY: Real-time tracking.' },
            { src: 'assets/images/projects/nova_analytics_1.jpg', caption: 'SYSTEM_BALANCE: Granular analysis.' },
            { src: 'assets/images/projects/nova_config.jpg', caption: 'SYSTEM_CONFIG: Advanced local storage management.' }
        ],
        github: 'https://github.com/LarssonCodes',
        apk: 'apk/nova.apk'
    },
    'spam-remover': {
        title: 'GMAIL SPAM REMOVER',
        windowTitle: 'SPAM_FILTER.PY',
        tagline: 'ML-powered Gmail cleaner that catches phishing and spam that standard filters miss — built with Naive Bayes.',
        platform: 'Web / Streamlit',
        type: 'ML Tool',
        stack: 'Python + Scikit-Learn',
        image: 'assets/images/spam_remover.jpg',
        description: 'An inbox hygiene tool applying Naive Bayes ML filters to Gmail accounts, identifying sophisticated phishing and marketing spam that Google\'s built-in filters often miss.',
        tags: ['Python', 'Scikit-Learn', 'Gmail API', 'OAuth2', 'Naive Bayes', 'Streamlit'],
        features: [
            'Multinomial Naive Bayes classification engine',
            'Secure Google OAuth 2.0 authentication flow',
            'Real-time scanning of unread messages via Gmail API',
            'Automated batch organisation into Trash / Spam folders',
            'Model serialisation for rapid cold-start classification',
            'Interactive Streamlit dashboard with live scan results'
        ],
        technical: 'Uses a Scikit-Learn pipeline for text vectorisation (CountVectorizer) and classification. Processes data locally to ensure privacy. Integrates with the Gmail API via google-auth-oauthlib. Deployed as an interactive Streamlit web app.',
        screenshots: [],
        github: 'https://github.com/LarssonCodes',
        apk: '#',
        demo: 'https://gmailspamremover.streamlit.app'
    },
    'inbawk': {
        title: 'INBAWK CARDS',
        windowTitle: 'INBAWK_BUILD.APK',
        tagline: 'Real-time multiplayer card game for the Mizo community — premium casino aesthetic on mobile.',
        platform: 'Android / iOS',
        type: 'Multiplayer Game',
        stack: 'Expo + Firebase',
        image: 'assets/images/inbawk_board.png',
        description: 'INBAWK brings the atmosphere of a professional card room to mobile. Designed for the Mizo community to enjoy classic and custom card games in a premium, real-time environment.',
        tags: ['React Native', 'Expo', 'Firebase', 'Realtime DB', 'Custom Shaders'],
        features: [
            'Real-time multiplayer lobbies with ~100ms latency',
            'Intelligent AI bots for solo play modes',
            'Premium aesthetic with custom asset shaders',
            'Cross-platform account sync via Firebase',
            'In-game chat and community features'
        ],
        technical: 'Built on Expo with heavy focus on landscape UI stability. Real-time sync uses Firebase Realtime Database listener trees. Custom character assets are dynamically tinted to reduce bundle size.',
        screenshots: [
            'assets/images/projects/inbawk_1.jpg',
            'assets/images/projects/inbawk_2.jpg',
            'assets/images/projects/inbawk_3.jpg',
            'assets/images/projects/inbawk_4.jpg',
            'assets/images/projects/inbawk_5.jpg',
            'assets/images/projects/inbawk_6.jpg'
        ],
        github: 'https://github.com/LarssonCodes',
        apk: '#'
    }
};

// ─── UI Utilities ────────────────────────────


// 2. Scroll Reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            const siblings = parent ? parent.querySelectorAll('.reveal') : [entry.target];
            let delay = 0;
            siblings.forEach((sib, i) => { if (sib === entry.target) delay = i * 80; });
            setTimeout(() => { if (entry.target) entry.target.classList.add('visible'); }, delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    // Failsafe
    setTimeout(() => {
        document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
    }, 2000);
}

// 3. Interaction Effects
function initInteractions() {
    // Parallax
    document.addEventListener('mousemove', (e) => {
        const boxes = document.querySelectorAll('.floating-box');
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (cx - e.clientX) / 55;
        const dy = (cy - e.clientY) / 55;
        boxes.forEach((box, i) => {
            const f = (i + 1) * 0.35;
            box.style.transform = `translate(${dx * f}px, ${dy * f}px) rotate(${i * 3 - 5}deg)`;
        });
    });

    // Stickers
    document.querySelectorAll('.sticker').forEach(sticker => {
        sticker.addEventListener('mousemove', (e) => {
            const rect = sticker.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const rx = (e.clientY - cy) / 5;
            const ry = -(e.clientX - cx) / 5;
            sticker.style.transform = `perspective(300px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.1)`;
        });
        sticker.addEventListener('mouseleave', () => sticker.style.transform = '');
    });

    // Nav
    const hamburger = document.getElementById('hamburger');
    const nav = document.querySelector('nav');
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => nav.classList.toggle('open'));
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => nav.classList.remove('open'));
        });
    }
}

// ─── Core Logic ──────────────────────────────

async function trackVisit() {
    if (sessionStorage.getItem(SESSION_TRACKED_KEY)) return;
    let count = parseInt(localStorage.getItem(VISIT_COUNT_KEY)) || 0;
    count++;
    localStorage.setItem(VISIT_COUNT_KEY, count);
    sessionStorage.setItem(SESSION_TRACKED_KEY, 'true');
    console.log('SYSTEM_LOG: VISIT_RECORDED');
}

window.initProjectDetail = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const project = projectsData[projectId];
    if (!project) return;

    window.currentProject = project;
    window.currentProjectId = projectId;

    const map = {
        'project-title': project.title,
        'project-desc-text': project.description,
        'technical-details': project.technical, // Fix missing mapping
        'info-platform': project.platform,
        'info-type': project.type,
        'info-stack': project.stack,
        'project-tagline': project.tagline,
        'window-title': project.windowTitle
    };

    for (let id in map) {
        const el = document.getElementById(id);
        if (el) el.textContent = map[id];
    }

    const heroImg = document.getElementById('project-hero-img');
    if (heroImg) heroImg.src = project.image;

    const githubLink = document.getElementById('btn-github');
    if (githubLink) githubLink.href = project.github;

    // Handle primary action button
    const trigger = document.getElementById('btn-download-trigger');
    if (trigger) {
        if (project.demo) {
            // Show "View Demo" button — opens Streamlit app in new tab
            trigger.innerHTML = `<i data-lucide="external-link" style="width:16px;height:16px;"></i> VIEW_DEMO`;
            trigger.classList.remove('btn-disabled');
            trigger.style.opacity = '1';
            trigger.style.cursor = 'pointer';
            trigger.onclick = () => window.open(project.demo, '_blank');
        } else if (!project.apk || project.apk === '#') {
            trigger.innerHTML = `<i data-lucide="clock" style="width:16px;height:16px;"></i> COMING_SOON`;
            trigger.classList.add('btn-disabled');
            trigger.style.opacity = '0.5';
            trigger.style.cursor = 'not-allowed';
            trigger.onclick = (e) => e.preventDefault();
        } else {
            trigger.innerHTML = `<i data-lucide="download" style="width:16px;height:16px;"></i> DOWNLOAD_APK`;
            trigger.classList.remove('btn-disabled');
            trigger.style.opacity = '1';
            trigger.style.cursor = 'pointer';
        }
    }

    // Lists
    const features = document.getElementById('project-features');
    if (features && project.features) {
        features.innerHTML = project.features.map(f => `<li>${f}</li>`).join('');
    }

    const tags = document.getElementById('project-tags');
    if (tags && project.tags) {
        tags.innerHTML = project.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');
    }

    const gallery = document.getElementById('project-gallery');
    const galleryWrapper = document.getElementById('gallery-wrapper');
    if (gallery && project.screenshots && project.screenshots.length > 0) {
        if (galleryWrapper) galleryWrapper.style.display = 'block'; // Show if screenshots exist
        gallery.innerHTML = project.screenshots.map(s => {
            const src = typeof s === 'string' ? s : s.src;
            return `<img src="${src}" loading="lazy">`;
        }).join('');
    } else if (galleryWrapper) {
        galleryWrapper.style.display = 'none';
    }

    if (window.lucide) lucide.createIcons();
    initProjectListeners();
};

function initProjectListeners() {
    const modal = document.getElementById('download-modal');
    const trigger = document.getElementById('btn-download-trigger');
    const closer = document.getElementById('close-modal');
    const signin = document.getElementById('google-signin-btn');
    const authStatus = document.getElementById('auth-status');
    const feedbackForm = document.getElementById('feedback-form');

    if (trigger && modal) {
        trigger.addEventListener('click', () => {
            // Only open modal for APK downloads (not demo links — those open inline via onclick)
            if (!window.currentProject?.demo && window.currentProject?.apk && window.currentProject.apk !== '#') {
                modal.style.display = 'flex';
            }
        });
    }
    if (closer && modal) closer.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    if (signin) {
        signin.addEventListener('click', async () => {
            const manualName = document.getElementById('user-name-input')?.value.trim();
            if (!manualName) {
                alert('IDENTIFICATION_REQUIRED: PLEASE ENTER YOUR NAME.');
                return;
            }

            signin.disabled = true;
            if (authStatus) { authStatus.style.display = 'block'; authStatus.textContent = 'AUTHORIZING...'; }

            try {
                const result = await signInWithPopup(auth, googleProvider);
                const userEmail = result.user.email;
                const projectId = window.currentProjectId;

                // Check for duplicate (by email and project)
                const q = query(collection(db, "downloads"),
                    where("userEmail", "==", userEmail),
                    where("projectId", "==", projectId)
                );
                const querySnapshot = await getDocs(q);

                const downloadData = {
                    projectId: projectId,
                    projectName: window.currentProject.title,
                    userName: manualName, // Use the manually entered name
                    userEmail: userEmail,
                    timestamp: serverTimestamp(),
                    verified: true
                };

                if (!querySnapshot.empty) {
                    // Update existing record
                    const existingDoc = querySnapshot.docs[0];
                    await setDoc(doc(db, "downloads", existingDoc.id), downloadData, { merge: true });
                    console.log('RECORD_UPDATED:', existingDoc.id);
                } else {
                    // Create new record
                    await addDoc(collection(db, "downloads"), downloadData);
                }

                if (authStatus) authStatus.textContent = 'ACCESS_GRANTED. DOWNLOADING...';
                if (window.currentProject.apk && window.currentProject.apk !== '#') {
                    window.location.href = window.currentProject.apk;
                }
            } catch (e) {
                if (authStatus) authStatus.textContent = 'ERROR: ' + e.message;
                signin.disabled = false;
            }
        });
    }

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = feedbackForm.querySelector('button');
            const status = document.getElementById('feedback-status');
            btn.disabled = true;
            try {
                await addDoc(collection(db, "feedback"), {
                    projectId: window.currentProjectId,
                    projectName: window.currentProject.title,
                    text: document.getElementById('feedback-text').value,
                    timestamp: serverTimestamp()
                });
                if (status) { status.style.display = 'block'; status.textContent = 'FEEDBACK_RECEIVED!'; }
                feedbackForm.reset();
            } finally {
                btn.disabled = false;
            }
        });
    }
}

window.deleteRecord = async function (docId) {
    if (!confirm('DELETE_RECORD: ARE_YOU_SURE?')) return;
    try {
        await deleteDoc(doc(db, "downloads", docId));
        console.log('RECORD_DELETED:', docId);
        window.initAdminDashboard();
    } catch (e) {
        alert('ERROR: ' + e.message);
    }
};

window.clearAllDownloads = async function () {
    if (!confirm('CAUTION: THIS_WILL_WIPE_ALL_DOWNLOAD_RECORDS. PROCEED?')) return;
    const diag = document.getElementById('admin-diagnostics');
    const log = (m) => { if (diag) diag.textContent = m; };

    log('CLEARING_RECORDS...');
    try {
        const snapshot = await getDocs(collection(db, "downloads"));
        const batch = writeBatch(db);
        snapshot.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        log('ALL_RECORDS_CLEARED');
        window.initAdminDashboard();
    } catch (e) {
        log('ERROR_CLEARING: ' + e.message);
    }
};

window.deleteProposal = async function (docId) {
    if (!confirm('DELETE_PROPOSAL: ARE_YOU_SURE?')) return;
    try {
        await deleteDoc(doc(db, "proposals", docId));
        window.initAdminDashboard();
    } catch (e) {
        alert('ERROR: ' + e.message);
    }
};

window.initAdminDashboard = async function () {
    const downloadsBody = document.getElementById('downloads-body');
    const feedbackList = document.getElementById('feedback-list');
    const proposalsList = document.getElementById('proposals-list');
    const diag = document.getElementById('admin-diagnostics');
    const log = (m) => { if (diag) diag.textContent = m; console.log(m); };

    log('CONNECTING...');

    // Populate visit count from localStorage
    const totalVisitsEl = document.getElementById('total-visits');
    if (totalVisitsEl) {
        totalVisitsEl.textContent = localStorage.getItem(VISIT_COUNT_KEY) || '0';
    }

    try {
        // Downloads
        const snapshot = await getDocs(collection(db, "downloads"));
        const docs = [];
        snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

        if (downloadsBody) {
            downloadsBody.innerHTML = docs.map(d => `
                <tr>
                    <td>${d.projectName || '—'}</td>
                    <td>${d.userName || '—'}</td>
                    <td>${d.userEmail || '—'}</td>
                    <td>${d.verified ? '[VERIFIED]' : '[MANUAL]'}</td>
                    <td>${d.timestamp ? d.timestamp.toDate().toLocaleString() : '—'}</td>
                    <td>
                        <button onclick="window.deleteRecord('${d.id}')" class="admin-btn btn-decline" style="padding: 4px 8px; font-size: 0.65rem; box-shadow: 2px 2px 0 black;">DELETE</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="6">NO_DATA</td></tr>';
        }

        // Feedback
        const feedbackSnap = await getDocs(collection(db, "feedback"));
        if (feedbackList) {
            feedbackList.innerHTML = '';
            feedbackSnap.forEach(doc => {
                const data = doc.data();
                feedbackList.innerHTML += `<div class="feedback-entry">${data.projectName}: ${data.text}</div>`;
            });
        }

        // Proposals
        const proposalSnap = await getDocs(collection(db, "proposals"));
        if (proposalsList) {
            const pDocs = [];
            proposalSnap.forEach(d => pDocs.push({ id: d.id, ...d.data() }));
            pDocs.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

            proposalsList.innerHTML = pDocs.map(p => `
                <div class="proposal-card window" style="margin-top:20px;">
                    <div class="window-header">
                        <span>PITCH_ID: ${p.id}</span>
                        <span>${p.timestamp ? p.timestamp.toDate().toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="window-content">
                        <div class="proposal-meta">
                            <span>CLIENT: ${p.clientName}</span>
                            ${p.clientEmail ? `<span>✉️ ${p.clientEmail}</span>` : ''}
                            ${p.clientPhone ? `<span>📞 ${p.clientPhone}</span>` : ''}
                            ${p.projectType ? `<span>DOMAIN: ${p.projectType}</span>` : ''}
                            ${p.budget ? `<span>BUDGET: ${p.budget}</span>` : ''}
                        </div>
                        <div class="proposal-details">
                            <p>${p.requirements}</p>
                        </div>
                        <div class="admin-actions" style="padding: 0;">
                            <button onclick="window.deleteProposal('${p.id}')" class="admin-btn btn-decline" style="font-size: 0.7rem;">DELETE</button>
                        </div>
                    </div>
                </div>
            `).join('') || '<div style="text-align: center; padding: 3rem; background: #fff; border: 1px solid var(--border); border-radius: 16px; color: var(--ink-muted);">NO_PROPOSALS_RECEIVED</div>';
        }

        log('COMPLETE');
    } catch (e) {
        log('ERROR: ' + e.message);
    }
};

function initAdminAuth() {
    const authNav = document.getElementById('admin-auth-nav');
    if (!authNav) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            authNav.innerHTML = `
                <span style="font-size:0.875rem; color:var(--ink-muted); margin-right:1rem;">Logged in as: ${user.email}</span>
                <button id="admin-signout-btn" class="admin-btn" style="padding: 0.4rem 1rem; font-size: 0.75rem;">Sign Out</button>
                <a href="index.html" style="margin-left:1.5rem;">← Live Site</a>
            `;
            const signoutBtn = document.getElementById('admin-signout-btn');
            if (signoutBtn) {
                signoutBtn.addEventListener('click', () => {
                    signOut(auth).then(() => {
                        window.location.reload();
                    });
                });
            }
            window.initAdminDashboard();
        } else {
            authNav.innerHTML = `
                <button id="admin-signin-btn" class="admin-btn" style="padding: 0.4rem 1rem; font-size: 0.75rem; border-color: var(--blue); color: var(--blue);">Authorize Admin</button>
                <a href="index.html" style="margin-left:1.5rem;">← Live Site</a>
            `;
            const signinBtn = document.getElementById('admin-signin-btn');
            if (signinBtn) {
                signinBtn.addEventListener('click', async () => {
                    try {
                        await signInWithPopup(auth, googleProvider);
                        window.location.reload();
                    } catch (e) {
                        alert("Sign in failed: " + e.message);
                    }
                });
            }
            window.initAdminDashboard();
        }
    });
}

// ─── Start ───────────────────────────────────

console.log('LARSSON.STUDIO: BOOTING...');


initInteractions();
trackVisit();
initReveal();

if (document.getElementById('proposals-list')) initAdminAuth();
if (document.getElementById('project-title')) window.initProjectDetail();

const buildForm = document.getElementById('build-form');
if (buildForm) {
    buildForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = buildForm.querySelector('button');
        const status = document.getElementById('status-msg');
        btn.disabled = true;

        const proposalData = {
            clientName: document.getElementById('client-name').value,
            clientPhone: document.getElementById('client-phone').value,
            projectType: document.getElementById('project-type').value,
            budget: document.getElementById('budget').value,
            requirements: document.getElementById('requirements').value,
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "proposals"), proposalData);
            if (status) {
                status.style.display = 'block';
                status.textContent = 'PROPOSAL_LOCKED_IN! I_WILL_REACH_OUT_SOON.';
            }
            buildForm.reset();
        } catch (error) {
            if (status) {
                status.style.display = 'block';
                status.textContent = 'ERROR_UPLOADING. PLEASE_TRY_GMAIL.';
            }
        } finally {
            btn.disabled = false;
        }
    });
}

const pitchForm = document.getElementById('pitch-form');
if (pitchForm) {
    pitchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = pitchForm.querySelector('button');
        const status = document.getElementById('pitch-status');
        btn.disabled = true;

        const proposalData = {
            clientName: document.getElementById('pitch-name').value,
            clientEmail: document.getElementById('pitch-email').value,
            requirements: document.getElementById('pitch-idea').value,
            timestamp: serverTimestamp()
        };

        try {
            // 1. Send email via Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: "aa77608e-a63c-48f0-9fed-de7c2277de18",
                    subject: "New App Idea Pitch from Portfolio",
                    from_name: "Larsson Portfolio",
                    name: proposalData.clientName,
                    email: proposalData.clientEmail,
                    message: proposalData.requirements
                })
            });
            const result = await response.json();
            
            if (response.status !== 200) {
                throw new Error(result.message || 'Web3Forms error');
            }

            // 2. Save to Firebase (wrapped in own try/catch so it doesn't block the email if it fails)
            try {
                await addDoc(collection(db, "proposals"), proposalData);
            } catch (fbError) {
                console.warn("Firebase save failed (usually due to permissions), but email was still sent:", fbError);
            }

            if (status) {
                status.style.display = 'block';
                status.textContent = 'App idea successfully sent to your email!';
            }
            pitchForm.reset();
        } catch (error) {
            if (status) {
                status.style.display = 'block';
                status.textContent = 'Error sending idea: ' + error.message;
            }
        } finally {
            btn.disabled = false;
        }
    });
}

// Expose functions for AI features to save to Firebase
window.submitPitchToFirebase = async function(data) {
    try {
        await addDoc(collection(db, "proposals"), {
            clientName: data.name,
            clientEmail: data.email,
            requirements: data.idea,
            aiScore: data.aiScore || null,
            timestamp: serverTimestamp()
        });
    } catch (fbError) {
        console.warn("Firebase save pitch failed:", fbError);
    }
};

window.saveContactMessageToFirebase = async function(data) {
    try {
        await addDoc(collection(db, "proposals"), {
            clientName: data.name,
            clientEmail: data.email,
            requirements: `[AI Contact] ${data.message}`,
            timestamp: serverTimestamp()
        });
    } catch (fbError) {
        console.warn("Firebase save contact failed:", fbError);
    }
};

// 3. Interactive Background Orbs Canvas
function initBackgroundOrbs() {
    const canvas = document.getElementById('orb-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const orbs = [
        {
            color: 'rgba(59, 130, 246, 0.14)', // Blue
            x: width * 0.85,
            y: height * 0.1,
            radius: Math.min(width, height) * 0.25,
            angle: 0,
            speed: 0.003,
            range: 50,
            ease: 0.02
        },
        {
            color: 'rgba(251, 191, 36, 0.09)', // Yellow
            x: width * 0.15,
            y: height * 0.75,
            radius: Math.min(width, height) * 0.32,
            angle: Math.PI / 3,
            speed: 0.002,
            range: 70,
            ease: 0.02
        },
        {
            color: 'rgba(251, 113, 133, 0.07)', // Rose
            x: width * 0.65,
            y: height * 0.5,
            radius: Math.min(width, height) * 0.2,
            angle: Math.PI * 2 / 3,
            speed: 0.004,
            range: 40,
            ease: 0.02
        }
    ];

    function drawOrbsStatic() {
        ctx.clearRect(0, 0, width, height);
        const minDim = Math.min(width, height);
        orbs[0].radius = minDim * 0.25;
        orbs[1].radius = minDim * 0.32;
        orbs[2].radius = minDim * 0.2;

        orbs.forEach((orb) => {
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
        });
    }

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        
        orbs[0].x = width * 0.85; orbs[0].y = height * 0.1;
        orbs[1].x = width * 0.15; orbs[1].y = height * 0.75;
        orbs[2].x = width * 0.65; orbs[2].y = height * 0.5;

        if (window.innerWidth < 901) {
            drawOrbsStatic();
        }
    });

    if (window.innerWidth < 901) {
        drawOrbsStatic();
        return; // Don't run animation loop on mobile
    }

    // Set target positions for animation on desktop
    orbs.forEach(orb => {
        orb.targetX = orb.x;
        orb.targetY = orb.y;
    });

    let mouseX = width / 2;
    let mouseY = height / 2;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const minDim = Math.min(width, height);
        orbs[0].radius = minDim * 0.25;
        orbs[1].radius = minDim * 0.32;
        orbs[2].radius = minDim * 0.2;

        orbs.forEach((orb, i) => {
            orb.angle += orb.speed;
            const driftX = Math.cos(orb.angle) * orb.range;
            const driftY = Math.sin(orb.angle) * orb.range;

            let baseX = 0;
            let baseY = 0;
            if (i === 0) { baseX = width * 0.85; baseY = height * 0.1; }
            else if (i === 1) { baseX = width * 0.15; baseY = height * 0.75; }
            else { baseX = width * 0.65; baseY = height * 0.5; }

            const dx = mouseX - orb.x;
            const dy = mouseY - orb.y;
            const dist = Math.hypot(dx, dy);

            const attractStrength = Math.max(0, 1 - dist / 500) * 80;
            const targetX = baseX + driftX + (dx / (dist || 1)) * attractStrength;
            const targetY = baseY + driftY + (dy / (dist || 1)) * attractStrength;

            orb.x += (targetX - orb.x) * orb.ease;
            orb.y += (targetY - orb.y) * orb.ease;

            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

initBackgroundOrbs();




