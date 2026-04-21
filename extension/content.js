const DEV_MODE_ENABLED = true;

const log = (...args) => {
  if (DEV_MODE_ENABLED) {
    console.log('[Prompt Enhancer V2]:', ...args);
  }
};

const icons = {
  wand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>',
  lightning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
};

const injectStyles = () => {
  if (document.getElementById('universal-enhancer-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'universal-enhancer-styles';
  styleEl.textContent = `
    .enhancer-widget-container {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 6px;
      pointer-events: none;
    }

    .enhancer-container {
      overflow: visible !important;
    }

    .enhancer-options-panel {
      display: none;
      align-items: center;
      gap: 6px;
      background: #111111;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 5px 10px;
      font-family: 'Inter', -apple-system, sans-serif;
      white-space: nowrap;
      z-index: 2147483647;
      box-sizing: border-box;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.3) transparent;
      pointer-events: auto;
      max-width: calc(100vw - 80px);
    }

    .enhancer-options-panel::-webkit-scrollbar {
      height: 3px;
    }
    .enhancer-options-panel::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .enhancer-options-panel.active {
      display: flex !important;
    }

    .universal-enhancer-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ffffff;
      color: #000000;
      border: 1.5px solid rgba(0, 0, 0, 0.1);
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      pointer-events: auto;
      flex-shrink: 0;
    }
    .universal-enhancer-btn svg { width: 16px; height: 16px; color: #000; }
    .universal-enhancer-btn:hover { transform: scale(1.1); background: #fff; }

    .mode-grid-btn {
      background: transparent;
      color: #aaa;
      border: none;
      border-radius: 10px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
      pointer-events: auto;
    }
    .mode-grid-btn:hover, .mode-grid-btn.active {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    .enhancer-divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.2);
      margin: 0 2px;
      flex-shrink: 0;
    }

    .enhancer-auto-btn {
      background: transparent;
      border: none;
      color: #777;
      cursor: pointer;
      padding: 5px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      pointer-events: auto;
    }
    .enhancer-auto-btn.active { color: #fff; }
  `;
  document.head.appendChild(styleEl);
  log("Styles injected.");
};

const checkPreferences = (callback) => {
  chrome.storage.sync.get(['enhancerEnabled', 'autoEnhance', 'enhancerMode'], (result) => {
    callback({
      enabled: result.enhancerEnabled !== false,
      auto: result.autoEnhance === true,
      mode: result.enhancerMode || 'general'
    });
  });
};

const setText = (element, newText) => {
  if (element.tagName === 'TEXTAREA') {
    element.value = newText;
  } else if (element.hasAttribute('contenteditable')) {
    element.innerText = newText;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

const extractText = (element) => {
  if (element.tagName === 'TEXTAREA') return element.value;
  if (element.hasAttribute('contenteditable')) return element.innerText;
  return '';
};

const enhancePrompt = async (text, button, mode) => {
  if (!text || text.trim() === '') return null;
  button.classList.add('loading');
  button.innerHTML = icons.spinner;
  try {
    const response = await chrome.runtime.sendMessage({ action: "ENHANCE_PROMPT", prompt: text, mode: mode });
    button.innerHTML = icons.wand;
    button.classList.remove('loading');
    return response.enhancedPrompt;
  } catch (err) {
    button.innerHTML = icons.wand;
    button.classList.remove('loading');
    return null;
  }
};

// Reposition the widget based on the input element's current position
const repositionWidget = (inputEl, widget) => {
  const rect = inputEl.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const btnWidth = 32;
  const gap = 8;
  const rightEdge = rect.right;
  const bottomEdge = rect.bottom;

  // Position wand button at bottom-right of input
  const btnRight = window.innerWidth - rightEdge + gap;
  const btnBottom = window.innerHeight - bottomEdge + gap;

  widget.style.right = Math.max(4, btnRight) + 'px';
  widget.style.bottom = Math.max(4, btnBottom) + 'px';
  widget.style.left = 'auto';
  widget.style.top = 'auto';

  // Clamp panel width so it never goes off left edge
  const panel = widget.querySelector('.enhancer-options-panel');
  if (panel) {
    const availableWidth = rightEdge - 10; // how much space is to the left of wand btn
    panel.style.maxWidth = Math.min(560, availableWidth) + 'px';
  }
};

const injectButtonForInput = (inputEl, prefs) => {
  if (inputEl.dataset.enhancerInjected === 'true') return;
  inputEl.dataset.enhancerInjected = 'true';

  const widget = document.createElement('div');
  widget.className = 'enhancer-widget-container';

  const panel = document.createElement('div');
  panel.className = 'enhancer-options-panel';

  const btn = document.createElement('button');
  btn.className = 'universal-enhancer-btn';
  btn.innerHTML = icons.wand;

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

  modes.forEach(m => {
    const mBtn = document.createElement('button');
    mBtn.className = `mode-grid-btn ${m.value === currentMode ? 'active' : ''}`;
    mBtn.textContent = m.label;
    mBtn.addEventListener('click', () => {
      currentMode = m.value;
      chrome.storage.sync.set({ enhancerMode: currentMode });
      panel.querySelectorAll('.mode-grid-btn').forEach(b => b.classList.toggle('active', b.textContent === m.label));
      panel.classList.remove('active');
    });
    panel.appendChild(mBtn);
  });

  const divider = document.createElement('div');
  divider.className = 'enhancer-divider';
  panel.appendChild(divider);

  const autoToggle = document.createElement('button');
  autoToggle.className = `enhancer-auto-btn ${isAutoEnabled ? 'active' : ''}`;
  autoToggle.innerHTML = icons.lightning;
  autoToggle.title = "Toggle Auto-Enhance";
  autoToggle.addEventListener('click', () => {
    isAutoEnabled = !isAutoEnabled;
    autoToggle.classList.toggle('active', isAutoEnabled);
    chrome.storage.sync.set({ autoEnhance: isAutoEnabled });
  });
  panel.appendChild(autoToggle);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = extractText(inputEl);
    if (!text.trim() || panel.classList.contains('active')) {
      panel.classList.toggle('active');
    } else {
      const enhanced = await enhancePrompt(text, btn, currentMode);
      if (enhanced) setText(inputEl, enhanced);
    }
  });

  widget.appendChild(panel);
  widget.appendChild(btn);

  // Attach to body so it's never clipped by any parent overflow
  document.body.appendChild(widget);

  // Position it now
  repositionWidget(inputEl, widget);

  // Reposition on scroll, resize, and focus
  const updatePos = () => repositionWidget(inputEl, widget);
  window.addEventListener('resize', updatePos);
  window.addEventListener('scroll', updatePos, true);
  inputEl.addEventListener('focus', updatePos);

  // Also poll every 500ms to handle dynamic layout shifts (sidebars opening etc)
  const poller = setInterval(() => {
    if (!document.body.contains(inputEl)) {
      clearInterval(poller);
      widget.remove();
      return;
    }
    updatePos();
  }, 500);

  document.addEventListener('mousedown', (e) => {
    if (!widget.contains(e.target)) {
      panel.classList.remove('active');
    }
  });
};

const scanForInputs = () => {
  checkPreferences((prefs) => {
    if (!prefs.enabled) return;
    document.querySelectorAll('textarea:not([data-enhancer-injected="true"]), div[contenteditable="true"]:not([data-enhancer-injected="true"])')
      .forEach(el => injectButtonForInput(el, prefs));
  });
};

const init = () => {
  injectStyles();
  scanForInputs();
  const observer = new MutationObserver(() => scanForInputs());
  observer.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}