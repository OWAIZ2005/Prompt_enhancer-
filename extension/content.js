const DEV_MODE_ENABLED = true;

const log = (...args) => {
  if (DEV_MODE_ENABLED) {
    console.log('[Prompt Enhancer V2]:', ...args);
  }
};

// Inject foundational styles into the page
const injectStyles = () => {
  if (document.getElementById('universal-enhancer-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'universal-enhancer-styles';
  styleEl.textContent = `
    .enhancer-widget-container {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .enhancer-options-panel {
      display: none;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 4px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      font-family: 'Inter', -apple-system, sans-serif;
      transition: all 0.2s ease;
      max-width: calc(100vw - 120px);
    }

    .enhancer-widget-container.show-options .enhancer-options-panel {
      display: flex;
    }

    .mode-grid-btn {
      background: transparent;
      color: #aaa;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .mode-grid-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .mode-grid-btn.active {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .enhancer-auto-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #888;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .universal-enhancer-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ffffff;
      color: #000000;
      border: 1px solid #ffffff;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      flex-shrink: 0;
      margin-left: 4px;
    }
    .universal-enhancer-btn svg {
      width: 16px;
      height: 16px;
      color: #000;
    }
    .universal-enhancer-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 16px rgba(255, 255, 255, 0.3);
      background: #fff;
    }
    .universal-enhancer-btn:active {
      transform: scale(0.95);
    }

    .universal-enhancer-btn.loading {
      background: #444;
      border-color: #444;
      cursor: not-allowed;
    }
    
    .universal-enhancer-btn.loading svg {
      color: #fff;
    }

    .enhancer-container {
      position: relative;
    }
    
    .enhancer-toast {
      position: absolute;
      bottom: 55px;
      right: 12px;
      background: #111;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-family: 'Inter', sans-serif;
      z-index: 10001;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
      box-shadow: 0 5px 15px rgba(0,0,0,0.4);
      white-space: nowrap;
    }
    
    .enhancer-toast.show {
      opacity: 1;
      transform: translateY(-5px);
    }
  `;
  document.head.appendChild(styleEl);
  log("Styles injected.");
};

const icons = {
  wand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>',
  lightning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
};

// Fetch preferences from sync storage
const checkPreferences = (callback) => {
  chrome.storage.sync.get(['enhancerEnabled', 'autoEnhance', 'enhancerMode'], (result) => {
    callback({
      enabled: result.enhancerEnabled !== false,
      auto: result.autoEnhance === true,
      mode: result.enhancerMode || 'general'
    });
  });
};

const saveToHistory = (enhancedText) => {
  chrome.storage.local.get(['promptHistory'], (result) => {
    let history = result.promptHistory || [];
    history.unshift(enhancedText); // Add to beginning
    if (history.length > 10) {     // Keep last 10
      history = history.slice(0, 10);
    }
    chrome.storage.local.set({ promptHistory: history });
    log("Saved prompt to history.");
  });
};

const showToast = (btn, message, isError = false) => {
  const container = btn.parentElement;
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `enhancer-toast ${isError ? 'error' : ''} show`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

const enhancePrompt = async (text, button, mode, isAuto = false) => {
  if (!text || text.trim() === '') return null;

  // Set loading state
  button.classList.add('loading');
  button.innerHTML = icons.spinner;
  log(`Enhancing prompt in ${mode} mode.`);

  try {
    const response = await chrome.runtime.sendMessage({
      action: "ENHANCE_PROMPT",
      prompt: text,
      mode: mode
    });

    if (response.error) throw new Error(response.error);

    button.classList.remove('loading');
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setTimeout(() => button.innerHTML = icons.wand, 2000);

    saveToHistory(response.enhancedPrompt);
    return response.enhancedPrompt;
  } catch (err) {
    log("Enhancer Error:", err);
    button.classList.remove('loading');
    button.classList.add('error');
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    showToast(button, err.message, true);
    setTimeout(() => {
      button.classList.remove('error');
      button.innerHTML = icons.wand;
    }, 3000);
    return null;
  }
};

const extractText = (element) => {
  if (element.tagName === 'TEXTAREA') return element.value;
  if (element.hasAttribute('contenteditable')) return element.innerText;
  return '';
};

const setText = (element, newText) => {
  if (element.tagName === 'TEXTAREA') {
    element.value = newText;
  } else if (element.hasAttribute('contenteditable')) {
    element.innerText = newText;
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

const injectButtonForInput = (inputEl, prefs) => {
  if (inputEl.dataset.enhancerInjected === 'true') return;
  inputEl.dataset.enhancerInjected = 'true';

  const parent = inputEl.parentElement;
  if (getComputedStyle(parent).position === 'static') {
    parent.classList.add('enhancer-container');
  }

  const widget = document.createElement('div');
  widget.className = 'enhancer-widget-container';

  const panel = document.createElement('div');
  panel.className = 'enhancer-options-panel';

  let currentMode = prefs.mode || 'general';
  let isAutoEnabled = prefs.auto || false;

  const modes = [
    { value: 'general', label: 'General' },
    { value: 'coding', label: 'Coding' },
    { value: 'startup', label: 'Startup' },
    { value: 'dsa', label: 'DSA' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'coding_practice', label: 'Practice' }
  ];

  const modeButtons = [];
  modes.forEach(m => {
    const mBtn = document.createElement('button');
    mBtn.className = `mode-grid-btn ${m.value === currentMode ? 'active' : ''}`;
    mBtn.textContent = m.label;
    mBtn.type = 'button';
    mBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentMode = m.value;
      chrome.storage.sync.set({ enhancerMode: currentMode });
      modeButtons.forEach(b => b.classList.remove('active'));
      mBtn.classList.add('active');
      widget.classList.remove('show-options'); // Close panel after selection
    });
    panel.appendChild(mBtn);
    modeButtons.push(mBtn);
  });

  const divider = document.createElement('div');
  divider.style.width = '1px';
  divider.style.height = '16px';
  divider.style.background = 'rgba(255,255,255,0.1)';
  panel.appendChild(divider);

  const autoToggle = document.createElement('button');
  autoToggle.type = 'button';
  autoToggle.className = `enhancer-auto-btn ${isAutoEnabled ? 'active' : ''}`;
  autoToggle.innerHTML = icons.lightning;
  autoToggle.title = "Toggle Auto-Enhance";
  autoToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isAutoEnabled = !isAutoEnabled;
    autoToggle.classList.toggle('active', isAutoEnabled);
    chrome.storage.sync.set({ autoEnhance: isAutoEnabled });
  });
  panel.appendChild(autoToggle);

  // Enhance Button Structure
  const btn = document.createElement('button');
  btn.className = 'universal-enhancer-btn';
  btn.title = "Enhance Prompt / Toggle Options";
  btn.innerHTML = icons.wand;
  btn.type = 'button';

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const currentText = extractText(inputEl);
    const isShowing = widget.classList.contains('show-options');

    if (!currentText.trim() && !isShowing) {
      // EMPTY + HIDDEN -> Show Options
      widget.classList.add('show-options');
      return;
    }

    if (isShowing) {
      // OPEN -> Hide Options (and Enhance if text exists)
      widget.classList.remove('show-options');
      if (currentText.trim()) {
        const enhanced = await enhancePrompt(currentText, btn, currentMode, false);
        if (enhanced) setText(inputEl, enhanced);
      }
      return;
    }

    // CLOSED + TEXT -> Enhance Normally
    if (currentText.trim()) {
      const enhanced = await enhancePrompt(currentText, btn, currentMode, false);
      if (enhanced) setText(inputEl, enhanced);
    } else {
      widget.classList.add('show-options');
    }
  });

  widget.appendChild(panel);
  widget.appendChild(btn);

  parent.appendChild(widget);

  // Click outside to close
  const clickOutside = (e) => {
    if (!widget.contains(e.target)) {
      widget.classList.remove('show-options');
    }
  };
  document.addEventListener('mousedown', clickOutside);
  
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.enhancerMode) {
        currentMode = changes.enhancerMode.newValue;
        modeButtons.forEach(b => {
          const mValue = modes.find(m => m.label === b.textContent)?.value;
          b.classList.toggle('active', mValue === currentMode);
        });
      }
      if (changes.autoEnhance) {
        isAutoEnabled = changes.autoEnhance.newValue;
        autoToggle.classList.toggle('active', isAutoEnabled);
      }
    }
  });

  let typingTimer;
  inputEl.addEventListener('input', () => {
    if (!isAutoEnabled) return;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      const currentText = extractText(inputEl);
      if (currentText.trim().length > 10) {
        const enhanced = await enhancePrompt(currentText, btn, currentMode, true);
        if (enhanced) setText(inputEl, enhanced);
      }
    }, 1500);
  });
};

const scanForInputs = () => {
  checkPreferences((prefs) => {
    if (!prefs.enabled) return;
    const textareas = document.querySelectorAll('textarea:not([data-enhancer-injected="true"])');
    const editables = document.querySelectorAll('div[contenteditable="true"]:not([data-enhancer-injected="true"])');

    textareas.forEach(el => injectButtonForInput(el, prefs));
    editables.forEach(el => injectButtonForInput(el, prefs));
  });
};

const init = () => {
  log("Initializing MutationObserver setup");
  injectStyles();
  scanForInputs(); 

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) scanForInputs();
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Clean UI if settings turned off live
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.enhancerEnabled) {
    if (changes.enhancerEnabled.newValue === false) {
      log("Extension disabled live. Removing widgets.");
      document.querySelectorAll('.enhancer-widget-container').forEach(widget => widget.remove());
      document.querySelectorAll('[data-enhancer-injected="true"]').forEach(el => {
        el.dataset.enhancerInjected = 'false';
      });
    } else {
      log("Extension enabled live. Scanning.");
      scanForInputs();
    }
  }
});
