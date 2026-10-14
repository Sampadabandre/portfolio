/**
 * SAMPADA BANDRE — PORTFOLIO JAVASCRIPT ENGINE
 * Handles tab transitions, desk view modes, certificate viewer,
 * project deep dives, gallery lightbox, Web Audio paper effects,
 * and contact dispatches.
 */

// State Management
const state = {
  soundEnabled: true,
  currentMode: 'desk', // 'desk' | 'scroll'
  theme: 'cozy', // 'cozy' | 'night'
  focusMode: false,
  audioContext: null
};

// Project Database for Deep Dive Modal
const projectsData = {
  stroke: {
    title: 'Explainable AI-Driven Stroke Risk Assessment Platform',
    pill: 'Healthcare AI • XAI • Counterfactuals',
    content: `
      <div class="project-modal-details">
        <p class="modal-lead">
          A machine learning platform designed to address the healthcare industry's high standard for model transparency. Traditional black-box neural networks and ensemble models struggle to gain clinical trust. This project builds a transparent stroke risk assessment system combining predictive accuracy with Explainable AI (XAI).
        </p>
        <h4 style="margin: 1.2rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.15rem;">Key Architecture & Deliverables:</h4>
        <ul style="padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
          <li><strong>Predictive Modeling:</strong> Trained on clinical stroke risk datasets utilizing Random Forest, Gradient Boosting, and Logistic Regression with comprehensive cross-validation.</li>
          <li><strong>Local & Global Interpretability:</strong> Integrated SHAP (SHapley Additive exPlanations) and feature attribution matrices to pinpoint patient-specific risk drivers (e.g. average glucose level, hypertension, age).</li>
          <li><strong>Counterfactual-Style Recommendations:</strong> Communicates personalized actionable guidance showing how minute adjustments in modifiable risk factors (e.g. reducing glucose by 15%) can drop predicted risk into safe tiers.</li>
          <li><strong>Interactive Clinical Dashboard:</strong> Built using Python & Gradio for intuitive simulation and clinician feedback.</li>
        </ul>
        <div style="margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <span class="chip">Python</span>
          <span class="chip">Scikit-learn</span>
          <span class="chip">SHAP</span>
          <span class="chip">Counterfactuals</span>
          <span class="chip">Gradio</span>
          <span class="chip">Pandas</span>
        </div>
      </div>
    `,
    github: 'https://github.com/Sampadabandre'
  },
  parkinsons: {
    title: 'Parkinson’s Disease Prediction Using Machine Learning',
    pill: 'IJCDS Journal Cond. Accepted • Acoustic ML',
    content: `
      <div class="project-modal-details">
        <div style="background: rgba(197, 155, 39, 0.12); padding: 0.85rem 1rem; border-radius: 8px; border-left: 3px solid var(--accent-gold); margin-bottom: 1rem;">
          <strong style="color: #926c09;">🏆 Research Milestone:</strong>
          <span style="font-size: 0.88rem; display: block; color: var(--text-primary); margin-top: 2px;">
            Research paper titled <em>"Parkinson’s Disease Prediction Using Machine Learning"</em> was conditionally accepted by the peer-reviewed <strong>International Journal of Computing and Digital Systems (IJCDS)</strong>.
          </span>
        </div>
        <p class="modal-lead">
          Parkinson's disease progressively damages motor control, often exhibiting subtle changes in vocal phonation before physical tremors emerge. This research leverages voice biomarker datasets to build a non-invasive, accessible screening solution.
        </p>
        <h4 style="margin: 1.2rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.15rem;">Key Architecture & Deliverables:</h4>
        <ul style="padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
          <li><strong>Acoustic Biomarker Engineering:</strong> Analyzed multi-dimensional acoustic parameters including vocal jitter (pitch variation), shimmer (amplitude variation), harmonic-to-noise ratio (HNR), and fundamental vocal frequency frequencies.</li>
          <li><strong>Model Optimization:</strong> Evaluated multiple algorithms, tuning hyper-parameters to maximize sensitivity and recall (critical for early medical diagnosis).</li>
          <li><strong>Feature Importance Analysis:</strong> Quantified the most influential phonation attributes contributing to diagnostic classification.</li>
          <li><strong>Reproducibility:</strong> Serialized model pipelines (Pickle / Scikit-learn) with preprocessing scalers and integrated web inference interface.</li>
        </ul>
        <div style="margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <span class="chip">Python</span>
          <span class="chip">Acoustic Signal Processing</span>
          <span class="chip">Scikit-learn</span>
          <span class="chip">IJCDS Journal Paper</span>
          <span class="chip">Streamlit</span>
        </div>
      </div>
    `,
    github: 'https://github.com/Sampadabandre/parkinsons-voice-detector'
  },
  climate: {
    title: 'Hybrid Climate Forecasting Ensemble Architecture',
    pill: 'Ensemble Learning • Environmental ML',
    content: `
      <div class="project-modal-details">
        <p class="modal-lead">
          Climate patterns exhibit non-linear chaotic dynamics that single statistical models often fail to capture. This project investigates a hybrid ensemble predictive pipeline combining diverse regression paradigms for accurate climate temperature anomaly forecasting.
        </p>
        <div style="margin: 1rem 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--paper-border);">
          <img src="assets/project_climate.png" alt="Model Evaluation Chart" style="width: 100%; display: block;">
        </div>
        <h4 style="margin: 1.2rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.15rem;">Key Architecture & Deliverables:</h4>
        <ul style="padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
          <li><strong>Multimodal Dataset Preprocessing:</strong> Cleaned, normalized, and engineered lag features across multi-year atmospheric sensor datasets.</li>
          <li><strong>Ensemble Architecture:</strong> Synthesized predictions from multiple estimators to balance variance and bias, evaluating performance across RMSE, MAE, and R² scores.</li>
          <li><strong>Model Evaluation Report:</strong> Generated comprehensive statistical presentation comparison charts and benchmarking logs.</li>
        </ul>
        <div style="margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <span class="chip">Python</span>
          <span class="chip">Ensemble ML</span>
          <span class="chip">Time Series Preprocessing</span>
          <span class="chip">Matplotlib</span>
          <span class="chip">Scikit-learn</span>
        </div>
      </div>
    `,
    github: 'https://github.com/Sampadabandre/Hybrid-Climate-Forecasting'
  },
  forensic: {
    title: 'ForensicAI: Automated Image Forensic Analysis',
    pill: 'Computer Vision • Forensic Detection',
    content: `
      <div class="project-modal-details">
        <p class="modal-lead">
          Digital image manipulation and synthetic media forgery require forensic scrutiny. ForensicAI is an exploratory deep learning and computer vision pipeline built in Google Colab to detect splicing and compression artifacts.
        </p>
        <div style="margin: 1rem 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--paper-border);">
          <img src="assets/project_forensic.jpeg" alt="Forensic Analysis Output" style="width: 100%; display: block;">
        </div>
        <h4 style="margin: 1.2rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.15rem;">Key Architecture & Deliverables:</h4>
        <ul style="padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
          <li><strong>Error Level Analysis (ELA):</strong> Implemented ELA routines to identify regions saved at differing compression ratios, exposing spliced image elements.</li>
          <li><strong>Noise Inconsistency Detection:</strong> Extracted high-frequency noise patterns to verify sensor response uniformity across the image plane.</li>
          <li><strong>Interactive Colab Workflow:</strong> Designed for rapid image upload, processing, and visual artifact overlay generation.</li>
        </ul>
        <div style="margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <span class="chip">Computer Vision</span>
          <span class="chip">OpenCV</span>
          <span class="chip">Google Colab</span>
          <span class="chip">Python</span>
        </div>
      </div>
    `,
    github: 'https://github.com/Sampadabandre/ForensicAi'
  },
  vacation: {
    title: 'Intelligent Vacation Planning Assistant',
    pill: 'Generative AI Agent • Groq LLM',
    content: `
      <div class="project-modal-details">
        <p class="modal-lead">
          An autonomous travel planning assistant harnessing large language models, dynamic agent prompts, and high-speed Groq inference to create personalized multi-day vacation itineraries.
        </p>
        <h4 style="margin: 1.2rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.15rem;">Key Architecture & Deliverables:</h4>
        <ul style="padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
          <li><strong>Agentic LLM Pipeline:</strong> Integrates Groq LLM API with fine-tuned system instructions for fast, structured travel itinerary generation.</li>
          <li><strong>Dynamic Customization:</strong> Accepts user destination preferences, trip duration, budget tier, and travel style to formulate day-by-day schedules.</li>
          <li><strong>Interactive UI:</strong> Engineered with Python and Gradio for responsive real-time generation and interactive user parameter tuning.</li>
        </ul>
        <div style="margin-top: 1.2rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
          <span class="chip">Python</span>
          <span class="chip">Gradio</span>
          <span class="chip">Groq LLM</span>
          <span class="chip">AI Agents</span>
          <span class="chip">Prompt Engineering</span>
        </div>
      </div>
    `,
    github: 'https://github.com/Sampadabandre/Intelligent-Vacation-Planning-Assistant'
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initViewModes();
  initTheme();
  initSound();
  initBackToTop();
  initBrandTypewriter();
  initSkillsFilter();
  initDeskEasterEggs();
  initModals();
  initScrollReveal();
});

/**
 * Web Audio API Synthesis: Tactile Paper Flip Sound
 * No external sound files needed! Works 100% reliably.
 */
function playPaperSound() {
  if (!state.soundEnabled) return;
  try {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) state.audioContext = new AudioCtx();
    }
    if (!state.audioContext) return;
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    const ctx = state.audioContext;
    const now = ctx.currentTime;

    // Create subtle noise burst for paper rustle
    const bufferSize = ctx.sampleRate * 0.06; // 60ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to soft paper frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  } catch (e) {
    // Graceful fallback if audio is disabled
  }
}

/**
 * Tactile ID Card Snap & Flip Sound (Rich Web Audio API Synthesis)
 * Realistic physical card flip: sharp flick transient + desk thwack + air friction whoosh
 */
function playCardSnapSound() {
  if (!state.soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!state.audioContext) {
      state.audioContext = new AudioCtx();
    }
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
    const ctx = state.audioContext;

    const executeSnapAudio = () => {
      const now = ctx.currentTime;

      // 1. Crisp Plastic Snap / Flick Click (transient edge click)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(1200, now);
      snapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

      snapGain.gain.setValueAtTime(0.42, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.06);

      // 2. Tactile Card Body "Thwack" (deep resonance of flipping card)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(320, now + 0.012);
      bodyOsc.frequency.exponentialRampToValueAtTime(75, now + 0.09);

      bodyGain.gain.setValueAtTime(0.35, now + 0.012);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodyOsc.start(now + 0.012);
      bodyOsc.stop(now + 0.10);

      // 3. Realistic Card Friction / Air Whoosh (Noise buffer)
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(1.4, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeSnapAudio).catch(executeSnapAudio);
    } else {
      executeSnapAudio();
    }
  } catch (err) {
    console.warn('Audio playback note:', err);
  }
}

/**
 * Authentic Coffee Sip Audio (Web Audio API Synthesis)
 * Realistic liquid sip air envelope + warm resonant ceramic mug clink
 */
function playCoffeeSipSound() {
  if (!state.soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!state.audioContext) state.audioContext = new AudioCtx();
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
    const ctx = state.audioContext;
    const now = ctx.currentTime;

    // 1. Soft liquid sip sound (shaped noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.11);
    filter.Q.setValueAtTime(3.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Ceramic cup subtle warm tone (resonant mug settling ping)
    const cupOsc = ctx.createOscillator();
    const cupGain = ctx.createGain();
    cupOsc.type = 'sine';
    cupOsc.frequency.setValueAtTime(1150, now + 0.08);
    cupOsc.frequency.exponentialRampToValueAtTime(840, now + 0.22);

    cupGain.gain.setValueAtTime(0.14, now + 0.08);
    cupGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    cupOsc.connect(cupGain);
    cupGain.connect(ctx.destination);
    cupOsc.start(now + 0.08);
    cupOsc.stop(now + 0.24);
  } catch (err) {}
}

/**
 * Optical Focus Adjustment Chime (Web Audio API Synthesis)
 * Crisp optic glass focus ping with harmonic resolution
 */
function playGlassesFocusSound(isActive) {
  if (!state.soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!state.audioContext) state.audioContext = new AudioCtx();
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
    const ctx = state.audioContext;
    const now = ctx.currentTime;

    const f1 = isActive ? 1760 : 1320;
    const f2 = isActive ? 2640 : 880;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(f1, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(f2, now + 0.04);
    gain2.gain.setValueAtTime(0.1, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.27);
  } catch (err) {}
}

/**
 * Mechanical Keyboard Typing Sound (Disabled per user request)
 */
function playTypewriterClickSound() {
  // Silent - sound removed per user request
}

/**
 * Interactive Keyboard Typing Effect for Dossier Title
 */
let triggerTitleTypewriter = null;

function initBrandTypewriter() {
  const textEl = document.getElementById('brandTypingText');
  const cursorEl = document.getElementById('brandTypingCursor');
  const coverBrand = document.getElementById('dossierCoverBrand');
  const coverTitle = document.getElementById('dossierCoverTitle');
  if (!textEl) return;

  const fullText = "Sampada's Portfolio";
  let isTyping = false;
  let typeTimer = null;
  let lastTriggerTime = 0;

  triggerTitleTypewriter = function(forceSound = true, restart = true) {
    const now = Date.now();
    // Prevent rapid re-triggering within 400ms
    if (now - lastTriggerTime < 400) return;
    if (isTyping && !restart) return;
    lastTriggerTime = now;

    if (typeTimer) clearTimeout(typeTimer);
    isTyping = true;

    textEl.textContent = '';
    if (cursorEl) {
      cursorEl.classList.remove('idle');
      cursorEl.style.opacity = '1';
    }

    let charIndex = 0;

    function typeNextChar() {
      if (charIndex < fullText.length) {
        textEl.textContent += fullText.charAt(charIndex);
        charIndex++;

        // Authentic human keystroke timing with slight cadence variations
        const currentChar = fullText.charAt(charIndex - 1);
        let delay = 70 + Math.random() * 35;
        if (currentChar === ' ' || currentChar === "'") {
          delay += 55; // realistic micro-pause
        }

        typeTimer = setTimeout(typeNextChar, delay);
      } else {
        isTyping = false;
        if (cursorEl) {
          cursorEl.classList.add('idle');
        }
      }
    }

    typeNextChar();
  };

  // Trigger typewriter transition when hovering over the brand title banner
  const handleHoverTyping = () => {
    triggerTitleTypewriter(true, true);
  };

  if (coverBrand) {
    coverBrand.addEventListener('mouseenter', handleHoverTyping);
  }
  if (coverTitle) {
    coverTitle.addEventListener('mouseenter', handleHoverTyping);
  }

  // Start initial typing when page entrance elevates
  setTimeout(() => {
    triggerTitleTypewriter(true, true);
  }, 680);
}

/**
 * Interactive Particle Sparkles on ID Badge Click
 */
function createBadgeSparkles(element) {
  try {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['#c59b27', '#c2593f', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'badge-sparkle-particle';
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
      const distance = 40 + Math.random() * 55;
      const destX = Math.cos(angle) * distance;
      const destY = Math.sin(angle) * distance;

      particle.style.setProperty('--dest-x', `${destX}px`);
      particle.style.setProperty('--dest-y', `${destY}px`);
      particle.style.backgroundColor = colors[i % colors.length];
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 700);
    }
  } catch (err) {
    // Ignore particle errors
  }
}

/**
 * Tab Navigation in Manila Dossier
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.dossier-tab');
  const tabRow = document.getElementById('dossierTabs');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      switchSection(targetId);

      // Briefly pause marquee when a tab is clicked so user can clearly see selection
      if (tabRow) {
        tabRow.classList.add('is-paused');
        clearTimeout(tabRow._pauseTimer);
        tabRow._pauseTimer = setTimeout(() => {
          tabRow.classList.remove('is-paused');
        }, 1600);
      }
    });
  });

  if (tabRow) {
    // Mobile touch & pointer support to pause/resume seamlessly
    tabRow.addEventListener('mouseenter', () => tabRow.classList.add('is-paused'));
    tabRow.addEventListener('mouseleave', () => tabRow.classList.remove('is-paused'));
    tabRow.addEventListener('touchstart', () => tabRow.classList.add('is-paused'), { passive: true });
    tabRow.addEventListener('touchend', () => {
      clearTimeout(tabRow._pauseTimer);
      tabRow._pauseTimer = setTimeout(() => {
        tabRow.classList.remove('is-paused');
      }, 1600);
    }, { passive: true });
  }
}

function switchSection(targetId) {
  playPaperSound();

  // If in Scroll View mode, smoothly scroll to section
  if (state.currentMode === 'scroll') {
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    updateActiveTabUI(targetId);
    return;
  }

  // Desk Mode: Toggle active classes
  const sections = document.querySelectorAll('.dossier-section');
  sections.forEach(sec => sec.classList.remove('active'));

  const targetSection = document.getElementById(targetId);
  if (targetSection) {
    targetSection.classList.add('active');
    // Ensure all items in newly activated section are in-view
    const revealItems = targetSection.querySelectorAll('.reveal-item');
    revealItems.forEach(item => item.classList.add('in-view'));

    // Scroll dossier smoothly to top of content
    const dossierBody = document.querySelector('.dossier-folder-body');
    if (dossierBody && window.innerWidth < 992) {
      dossierBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateActiveTabUI(targetId);
}

function updateActiveTabUI(targetId) {
  const tabs = document.querySelectorAll('.dossier-tab');
  tabs.forEach(tab => {
    const isTarget = tab.getAttribute('data-target') === targetId;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });
}

/**
 * Dual View Modes: Desk Flatlay View vs Full Scroll View
 */
function initViewModes() {
  const btnDesk = document.getElementById('btnDeskView');
  const btnScroll = document.getElementById('btnScrollView');

  if (btnDesk && btnScroll) {
    btnDesk.addEventListener('click', () => {
      setPortfolioMode('desk');
    });

    btnScroll.addEventListener('click', () => {
      setPortfolioMode('scroll');
    });
  }
}

function setPortfolioMode(mode) {
  state.currentMode = mode;
  playPaperSound();

  const body = document.body;
  const btnDesk = document.getElementById('btnDeskView');
  const btnScroll = document.getElementById('btnScrollView');

  if (mode === 'scroll') {
    body.classList.remove('mode-desk');
    body.classList.add('mode-scroll');
    btnScroll.classList.add('active');
    btnDesk.classList.remove('active');
    showToast('📜 Switched to Full Editorial Scroll View');
  } else {
    body.classList.remove('mode-scroll');
    body.classList.add('mode-desk');
    btnDesk.classList.add('active');
    btnScroll.classList.remove('active');
    showToast('🗂️ Switched to Interactive Desk Dossier View');
  }
}

/**
 * Desk Theme Lighting Toggle
 */
function initTheme() {
  const themeToggle = document.getElementById('btnThemeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // Load saved theme
  const savedTheme = localStorage.getItem('sampada_theme') || 'cozy';
  if (savedTheme === 'night') {
    document.body.classList.add('theme-night');
    state.theme = 'night';
    if (themeIcon) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      playPaperSound();
      if (document.body.classList.contains('theme-night')) {
        document.body.classList.remove('theme-night');
        state.theme = 'cozy';
        localStorage.setItem('sampada_theme', 'cozy');
        if (themeIcon) {
          themeIcon.classList.remove('fa-sun');
          themeIcon.classList.add('fa-moon');
        }
        showToast('☀️ Day Desk: Warm Linen Paper active');
      } else {
        document.body.classList.add('theme-night');
        state.theme = 'night';
        localStorage.setItem('sampada_theme', 'night');
        if (themeIcon) {
          themeIcon.classList.remove('fa-moon');
          themeIcon.classList.add('fa-sun');
        }
        showToast('🌙 Night Desk: Midnight Studio active');
      }
    });
  }
}

/**
 * Tactile Sound Management: Master Mute & Persistence
 */
function setSoundEnabled(enabled, triggerToast = false) {
  state.soundEnabled = enabled;
  try {
    localStorage.setItem('sampada_sound_enabled', enabled ? 'true' : 'false');
  } catch (e) {}

  const soundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');

  if (enabled) {
    if (soundIcon) {
      soundIcon.className = 'fa-solid fa-volume-high';
    }
    if (soundToggle) {
      soundToggle.classList.remove('is-muted');
      soundToggle.setAttribute('title', 'Sound Effects Enabled (Click to Mute)');
      soundToggle.setAttribute('aria-label', 'Sound Effects Enabled (Click to Mute)');
    }
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
    if (triggerToast) {
      playPaperSound();
      showToast('🔊 Paper rustle sounds enabled');
    }
  } else {
    if (soundIcon) {
      soundIcon.className = 'fa-solid fa-volume-xmark';
    }
    if (soundToggle) {
      soundToggle.classList.add('is-muted');
      soundToggle.setAttribute('title', 'All Sounds Muted (Click to Unmute)');
      soundToggle.setAttribute('aria-label', 'All Sounds Muted (Click to Unmute)');
    }
    // Hard suspend AudioContext to ensure complete silence
    if (state.audioContext && state.audioContext.state === 'running') {
      state.audioContext.suspend().catch(() => {});
    }
    if (triggerToast) {
      showToast('🔇 All sounds muted');
    }
  }
}

function initSound() {
  const soundToggle = document.getElementById('btnSoundToggle');
  
  // Load saved sound preference (default to enabled if not set)
  const savedPref = localStorage.getItem('sampada_sound_enabled');
  if (savedPref === 'false') {
    setSoundEnabled(false, false);
  } else {
    setSoundEnabled(true, false);
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSoundEnabled(!state.soundEnabled, true);
    });
  }
}

/**
 * Back To Top Navigation with Animated Arrow Transition
 */
function initBackToTop() {
  const topButtons = [
    document.getElementById('btnBackToTop'),
    document.getElementById('floatingBackToTop')
  ].filter(Boolean);

  const scrollToTop = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playPaperSound();

    // 1. Smoothly scroll main page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    document.body.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // 2. Also scroll dossier body if user was scrolled inside
    const dossierBody = document.querySelector('.dossier-folder-body');
    if (dossierBody) {
      dossierBody.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }

    // 3. Scroll top-desk-bar or header into view
    const topBar = document.getElementById('topDeskBar');
    if (topBar) {
      topBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  topButtons.forEach(btn => {
    btn.addEventListener('click', scrollToTop);
  });

  // Track scroll position to reveal floating top button
  const floatingBtn = document.getElementById('floatingBackToTop');
  if (floatingBtn) {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollY > 380) {
        floatingBtn.classList.add('is-visible');
      } else {
        floatingBtn.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }
}

/**
 * Skills Filtering Logic
 */
function initSkillsFilter() {
  const filterBtns = document.querySelectorAll('.skill-filter-btn');
  const skillCards = document.querySelectorAll('.skill-group-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playPaperSound();
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');
      skillCards.forEach(card => {
        if (filterVal === 'all' || card.getAttribute('data-category') === filterVal) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Curated Collection of AI, Engineering & Life Inspiration Quotes
 */
const INSPIRATION_QUOTES = [
  {
    quote: "The best way to predict the future is to invent it.",
    author: "Alan Kay — Computing Pioneer"
  },
  {
    quote: "Artificial intelligence is not a substitute for human intelligence; it is a tool to amplify human ingenuity.",
    author: "AI Research Principle"
  },
  {
    quote: "The question of whether machines can think is like the question of whether submarines can swim.",
    author: "Edsger W. Dijkstra — Computer Science Pioneer"
  },
  {
    quote: "Code is like humor. When you have to explain it, it’s bad.",
    author: "Cory House — Software Architect"
  },
  {
    quote: "Machine learning is not just about algorithms; it’s about giving machines the curiosity to learn from the world.",
    author: "Sampada's Engineering Journal"
  },
  {
    quote: "In the middle of difficulty lies opportunity. Keep debugging, breakthroughs are near.",
    author: "Albert Einstein"
  },
  {
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra"
  },
  {
    quote: "Any sufficiently advanced technology is indistinguishable from magic.",
    author: "Arthur C. Clarke"
  },
  {
    quote: "Curiosity is the engine of achievement. Never stop experimenting with models, algorithms, and ideas.",
    author: "Ken Robinson"
  },
  {
    quote: "A mind that makes things: Not just learning technology, but building something meaningful with it.",
    author: "Sampada Bandre — AI & ML Engineer"
  },
  {
    quote: "Small daily steps in training, tuning, and problem solving lead to giant leaps in innovation.",
    author: "Tech Engineering Axiom"
  },
  {
    quote: "Stay hungry, stay curious, and always keep an open mind for discovery.",
    author: "Steve Jobs"
  }
];

let currentInspirationIndex = -1;

/**
 * Pours and displays a fresh sip of inspiration
 */
function showNextInspiration() {
  const popup = document.getElementById('inspirationPopup');
  const quoteEl = document.getElementById('inspirationQuoteText');
  const authorEl = document.getElementById('inspirationAuthor');
  const cup = document.getElementById('coffeeCup');
  const steam = document.getElementById('steamContainer');

  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * INSPIRATION_QUOTES.length);
  } while (nextIndex === currentInspirationIndex && INSPIRATION_QUOTES.length > 1);
  currentInspirationIndex = nextIndex;

  const item = INSPIRATION_QUOTES[currentInspirationIndex];

  // Cup wobble sipping animation
  if (cup) {
    cup.classList.remove('sipping');
    void cup.offsetWidth; // Trigger DOM reflow
    cup.classList.add('sipping');
  }

  // Steam puff burst
  if (steam) {
    steam.style.opacity = '1';
    steam.style.transform = 'translateX(-50%) translateY(-18px) scale(1.35)';
    setTimeout(() => {
      steam.style.opacity = '';
      steam.style.transform = '';
    }, 1800);
  }

  // Sound effect
  playCoffeeSipSound();

  // Populate popup card with gentle fade
  if (quoteEl && authorEl) {
    quoteEl.style.opacity = '0';
    setTimeout(() => {
      quoteEl.textContent = item.quote;
      authorEl.textContent = `— ${item.author}`;
      quoteEl.style.opacity = '1';
    }, 120);
  }

  if (popup) {
    popup.classList.add('show');
    popup.setAttribute('aria-hidden', 'false');
  }

  showToast('☕ Fresh sip of inspiration poured!');
}

function hideInspiration() {
  const popup = document.getElementById('inspirationPopup');
  if (popup && popup.classList.contains('show')) {
    popup.classList.remove('show');
    popup.setAttribute('aria-hidden', 'true');
    playPaperSound();
  }
}

/**
 * Toggles Deep Focus Reading Mode
 */
function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  const isFocus = state.focusMode;
  const body = document.body;
  const hud = document.getElementById('focusModeHud');
  const glassesPill = document.getElementById('glassesHintPill');

  if (isFocus) {
    body.classList.add('focus-mode-active');
    if (hud) hud.setAttribute('aria-hidden', 'false');
    if (glassesPill) {
      glassesPill.innerHTML = '<i class="fa-solid fa-glasses"></i> Exit Focus Mode';
    }
    playGlassesFocusSound(true);
    showToast('👓 Focus Mode Activated: Peripheral distractions dimmed for deep reading.');
  } else {
    body.classList.remove('focus-mode-active');
    if (hud) hud.setAttribute('aria-hidden', 'true');
    if (glassesPill) {
      glassesPill.innerHTML = '<i class="fa-solid fa-glasses"></i> Click for Focus Mode';
    }
    playGlassesFocusSound(false);
    showToast('👓 Focus Mode Deactivated: Restored full desk view.');
  }
}

/**
 * Interactive Desk Easter Eggs
 */
function initDeskEasterEggs() {
  // Coffee cup click & keypress
  const coffeeCup = document.getElementById('coffeeCup');
  if (coffeeCup) {
    coffeeCup.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextInspiration();
    });

    coffeeCup.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showNextInspiration();
      }
    });
  }

  // Another sip button inside popup
  const btnAnotherSip = document.getElementById('btnAnotherSip');
  if (btnAnotherSip) {
    btnAnotherSip.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextInspiration();
    });
  }

  // Close inspiration button
  const btnInspireClose = document.getElementById('btnInspireClose');
  if (btnInspireClose) {
    btnInspireClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideInspiration();
    });
  }

  // Glasses click & keypress
  const glasses = document.getElementById('glassesElement');
  if (glasses) {
    glasses.addEventListener('click', () => {
      toggleFocusMode();
    });

    glasses.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFocusMode();
      }
    });
  }

  // Exit Focus Mode button in HUD
  const btnExitFocusMode = document.getElementById('btnExitFocusMode');
  if (btnExitFocusMode) {
    btnExitFocusMode.addEventListener('click', () => {
      toggleFocusMode();
    });
  }

  // Global keydown: Escape key dismisses focus mode and inspiration popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.focusMode) {
        toggleFocusMode();
      }
      hideInspiration();
    }
  });

  // Global click: dismiss inspiration popup if clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('inspirationPopup');
    const coffeeCluster = document.getElementById('coffeeCluster');
    if (popup && popup.classList.contains('show')) {
      if (coffeeCluster && !coffeeCluster.contains(e.target)) {
        hideInspiration();
      }
    }
  });

  // Student ID card 3D flip & interactive feedback
  const idBadge = document.getElementById('studentIdBadge');
  const idFlipPill = document.getElementById('idFlipPill');
  if (idBadge) {
    idBadge.addEventListener('click', () => {
      // Toggle 3D flip
      idBadge.classList.toggle('flipped');
      const isFlipped = idBadge.classList.contains('flipped');

      // Play authentic card snap audio
      playCardSnapSound();

      // Trigger sparkle burst
      createBadgeSparkles(idBadge);

      // Update interactive pill text
      if (idFlipPill) {
        idFlipPill.innerHTML = isFlipped 
          ? '<i class="fa-solid fa-arrows-rotate"></i> Flip to Photo ID' 
          : '<i class="fa-solid fa-arrows-rotate"></i> Click to Flip ID';
      }

      // Show contextual toast message
      if (isFlipped) {
        showToast('💡 A mind that makes things: Not just learning technology. Making something with it.');
      } else {
        showToast('🪪 Student ID (Front): Sampada Bandre — AI & ML Engineer (CGPA: 8.14 / 10).');
      }
    });
  }

  // Sticky note click & hover tactile feedback
  const sticky = document.getElementById('stickyGreeting');
  if (sticky) {
    sticky.addEventListener('mouseenter', () => {
      playPaperSound();
    });
    sticky.addEventListener('click', () => {
      playPaperSound();
      createBadgeSparkles(sticky);
      showToast('📝 Note: Feel free to download my resume or connect directly!');
    });
  }

  // Central Dossier Cover Brand click tactile feedback (Typewriter triggers on hover)
  const coverBrand = document.getElementById('dossierCoverBrand');
  if (coverBrand) {
    coverBrand.addEventListener('click', () => {
      createBadgeSparkles(coverBrand);
      showToast('🎓 Sampada Bandre — B.Tech CSE (AI & ML) • Class of 2028');
    });
  }
}

/**
 * Modals Management
 */
function initModals() {
  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCertModal();
      closePatentModal();
      closeLightboxModal();
      closeProjectModal();
    }
  });

  // Close when clicking outside modal window
  const overlays = document.querySelectorAll('.custom-modal-overlay');
  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeCertModal();
        closePatentModal();
        closeLightboxModal();
        closeProjectModal();
      }
    });
  });
}

// Patent Gazette Official PDF Modal
function openPatentModal() {
  playPaperSound();
  const modal = document.getElementById('patentModal');
  if (modal) {
    switchPatentModalPage(2);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closePatentModal() {
  playPaperSound();
  const modal = document.getElementById('patentModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function switchPatentModalPage(pageNum) {
  playPaperSound();
  const imgEl = document.getElementById('patentModalImg');
  const btn1 = document.getElementById('patentPage1Btn');
  const btn2 = document.getElementById('patentPage2Btn');
  if (pageNum === 1) {
    if (imgEl) imgEl.src = 'assets/patent_gazette_page1.png';
    if (btn1) btn1.classList.add('active');
    if (btn2) btn2.classList.remove('active');
  } else {
    if (imgEl) imgEl.src = 'assets/patent_gazette_page2.png';
    if (btn2) btn2.classList.add('active');
    if (btn1) btn1.classList.remove('active');
  }
}

// Certificate Modal
function openCertModal(imageSrc, title, description) {
  playPaperSound();
  const modal = document.getElementById('certModal');
  const imgEl = document.getElementById('certModalImg');
  const titleEl = document.getElementById('certModalTitle');
  const descEl = document.getElementById('certModalDesc');
  const downloadLink = document.getElementById('certModalDownloadLink');

  if (imgEl) imgEl.src = imageSrc;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = description;
  if (downloadLink) {
    downloadLink.href = imageSrc;
    downloadLink.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg';
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeCertModal() {
  playPaperSound();
  const modal = document.getElementById('certModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Gallery Lightbox Modal
function openImageLightbox(imageSrc, title, caption) {
  playPaperSound();
  const modal = document.getElementById('lightboxModal');
  const imgEl = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');
  const captionEl = document.getElementById('lightboxCaption');

  if (imgEl) imgEl.src = imageSrc;
  if (titleEl) titleEl.textContent = title;
  if (captionEl) captionEl.textContent = caption;

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightboxModal() {
  playPaperSound();
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Project Detail Modal
function openProjectDetail(projectId) {
  playPaperSound();
  const project = projectsData[projectId];
  if (!project) return;

  const modal = document.getElementById('projectModal');
  const pillEl = document.getElementById('projectModalPill');
  const titleEl = document.getElementById('projectModalTitle');
  const bodyEl = document.getElementById('projectModalBody');
  const githubBtn = document.getElementById('projectModalGithubBtn');

  if (pillEl) pillEl.innerHTML = `<i class="fa-solid fa-code-branch"></i> ${project.pill}`;
  if (titleEl) titleEl.textContent = project.title;
  if (bodyEl) bodyEl.innerHTML = project.content;
  if (githubBtn) githubBtn.href = project.github;

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeProjectModal() {
  playPaperSound();
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/**
 * Contact Form & Communications
 */
function handleFormSubmit(event) {
  event.preventDefault();
  playPaperSound();

  const name = document.getElementById('senderName').value.trim();
  const email = document.getElementById('senderEmail').value.trim();
  const subject = document.getElementById('messageSubject').value.trim() || 'Connecting via Portfolio';
  const message = document.getElementById('messageBody').value.trim();

  const notice = document.getElementById('formStatusNotice');
  if (notice) {
    notice.style.display = 'block';
    notice.className = 'form-status-notice success';
    notice.innerHTML = `
      <i class="fa-solid fa-circle-check"></i> Thank you, <strong>${escapeHtml(name)}</strong>! Preparing your email dispatch to <strong>sampadabandre2@gmail.com</strong>...
    `;
  }

  // Construct mailto link
  const mailtoUrl = `mailto:sampadabandre2@gmail.com?subject=${encodeURIComponent(subject + ' - ' + name)}&body=${encodeURIComponent(message + '\n\n---\nSender Email: ' + email)}`;
  
  setTimeout(() => {
    window.location.href = mailtoUrl;
    showToast('✉️ Opening your email client to send message to Sampada!');
  }, 750);
}

function copyEmailToClipboard() {
  playPaperSound();
  const email = 'sampadabandre2@gmail.com';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(email).then(() => {
      showToast('📋 Copied sampadabandre2@gmail.com to clipboard!');
    }).catch(() => {
      fallbackCopyText(email);
    });
  } else {
    fallbackCopyText(email);
  }
}

function fallbackCopyText(text) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  showToast('📋 Copied sampadabandre2@gmail.com to clipboard!');
}

/**
 * Toast Notification Utility
 */
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  toast.innerHTML = `<span style="font-size: 1.1rem;">✨</span> <span>${message}</span>`;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Interactive Scroll & Component Reveal for cards and sections
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    '.project-card, .skill-group-card, .cert-card, .timeline-item, .patent-feature-card, .experience-item, .gallery-item, .contact-card, .credential-card'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => {
      el.classList.add('reveal-item');
      observer.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add('in-view'));
  }
}
