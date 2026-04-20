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
    .universal-enhancer-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 10000;
      background: linear-gradient(135deg, #6e8efb, #a777e3);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    .universal-enhancer-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, #5b7be0, #9661d9);
    }
    .universal-enhancer-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .universal-enhancer-btn.loading {
      background: #888;
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.8;
    }
    .universal-enhancer-btn.error {
      background: #e74c3c;
    }
    .enhancer-container {
      position: relative;
    }
    .enhancer-toast {
      position: absolute;
      bottom: 45px;
      right: 10px;
      background: #333;
      color: #fff;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Inter', sans-serif;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    }
    .enhancer-toast.show {
      opacity: 1;
    }
    .enhancer-toast.error {
      background: #e74c3c;
    }
  `;
  document.head.appendChild(styleEl);
  log("Styles injected.");
};

const icons = {
  wand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'
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
  toast.className = \`enhancer-toast \${isError ? 'error' : ''} show\`;
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
  button.innerHTML = \`\${icons.spinner} \${isAuto ? 'Auto-Enhancing...' : 'Enhancing...'}\`;
  log(\`Enhancing prompt in \${mode} mode.\`);

  try {
    const response = await chrome.runtime.sendMessage({
      action: "ENHANCE_PROMPT",
      prompt: text,
      mode: mode
    });

    if (response.error) throw new Error(response.error);

    button.classList.remove('loading');
    button.innerHTML = \`\${icons.wand} Enhanced!\`;
    setTimeout(() => button.innerHTML = \`\${icons.wand} Enhance\`, 2000);

    saveToHistory(response.enhancedPrompt);
    return response.enhancedPrompt;
  } catch (err) {
    log("Enhancer Error:", err);
    button.classList.remove('loading');
    button.classList.add('error');
    button.innerHTML = 'Error!';
    showToast(button, err.message, true);
    setTimeout(() => {
      button.classList.remove('error');
      button.innerHTML = \`\${icons.wand} Enhance\`;
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

  const btn = document.createElement('button');
  btn.className = 'universal-enhancer-btn';
  btn.innerHTML = \`\${icons.wand} Enhance\`;
  btn.type = 'button';

  // Manual Trigger
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Refetch latest prefs when clicked
    checkPreferences(async (latestPrefs) => {
      const currentText = extractText(inputEl);
      if (!currentText.trim()) {
        showToast(btn, 'Please enter a prompt first.');
        return;
      }
      const enhanced = await enhancePrompt(currentText, btn, latestPrefs.mode, false);
      if (enhanced) setText(inputEl, enhanced);
    });
  });

  parent.appendChild(btn);
  log("Button injected for element", inputEl);

  // Auto-Enhance Trigger (Debounced)
  let typingTimer;
  inputEl.addEventListener('input', () => {
    checkPreferences((latestPrefs) => {
      if (!latestPrefs.auto || !latestPrefs.enabled) return;

      clearTimeout(typingTimer);
      typingTimer = setTimeout(async () => {
        const currentText = extractText(inputEl);
        // Only trigger if there is substantial text
        if (currentText.trim().length > 10) {
          const enhanced = await enhancePrompt(currentText, btn, latestPrefs.mode, true);
          if (enhanced) {
            setText(inputEl, enhanced);
            showToast(btn, 'Auto-enhanced successfully!');
          }
        }
      }, 1500); // 1.5 seconds debounce
    });
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
      log("Extension disabled live. Removing buttons.");
      document.querySelectorAll('.universal-enhancer-btn').forEach(btn => btn.remove());
      document.querySelectorAll('[data-enhancer-injected="true"]').forEach(el => {
        el.dataset.enhancerInjected = 'false';
      });
    } else {
      log("Extension enabled live. Scanning.");
      scanForInputs();
    }
  }
});
