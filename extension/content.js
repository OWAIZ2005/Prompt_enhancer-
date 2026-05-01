const DEV_MODE_ENABLED = true;

const log = (...args) => {
  if (DEV_MODE_ENABLED) {
    console.log('[Prompt Enhancer V2]:', ...args);
  }
};

const icons = {
  wand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>',
  lightning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
};

// ─── DOMAIN & HYBRID DETECTION ────────────────────────────────────────────────

const SUPPORTED_DOMAINS = [
  'chatgpt.com',
  'openai.com',
  'gemini.google.com',
  'google.com',
  'claude.ai',
  'perplexity.ai',
  'poe.com',
  'bing.com',
  'microsoft.com',
  'meta.ai',
  'mistral.ai',
  'groq.com',
  'deepseek.com',
  'huggingface.co'
];

const checkIsAIPlatform = () => {
  const host = window.location.hostname;

  if (SUPPORTED_DOMAINS.some(domain => host.includes(domain))) {
    log('Matched whitelist domain:', host);
    return true;
  }

  const metaTags = document.getElementsByTagName('meta');
  const aiKeywords = ['llm', 'ai assistant', 'chatbot', 'generative ai'];

  for (const meta of metaTags) {
    const content = (meta.getAttribute('content') || '').toLowerCase();
    const name = (meta.getAttribute('name') || meta.getAttribute('property') || '').toLowerCase();
    if (name.includes('description') || name.includes('title')) {
      if (aiKeywords.some(kw => content.includes(kw))) {
        log('Detected AI platform via heuristics');
        return true;
      }
    }
  }

  return false;
};

// ─── PREFERENCES ──────────────────────────────────────────────────────────────

const checkPreferences = (callback) => {
  chrome.storage.sync.get(['enhancerEnabled', 'enhancerMode'], (result) => {
    callback({
      enabled: result.enhancerEnabled !== false,
      mode: result.enhancerMode || 'general'
    });
  });
};

// ─── TEXT HELPERS ─────────────────────────────────────────────────────────────

const setText = (element, newText) => {
  if (element.tagName === 'TEXTAREA') {
    element.value = newText;
  } else if (element.hasAttribute('contenteditable')) {
    element.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, newText);
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

const extractText = (element) => {
  if (element.tagName === 'TEXTAREA') return element.value;
  if (element.hasAttribute('contenteditable')) return element.innerText;
  return '';
};

// ─── ENHANCE ──────────────────────────────────────────────────────────────────

const enhancePrompt = async (text, button, mode) => {
  if (!text || text.trim() === '') return null;
  button.classList.add('loading');
  button.innerHTML = icons.spinner;
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'ENHANCE_PROMPT',
      prompt: text,
      mode
    });
    button.innerHTML = icons.wand;
    button.classList.remove('loading');
    if (response && response.enhancedPrompt) return response.enhancedPrompt;
    log('No enhancedPrompt in response:', response);
    return null;
  } catch (err) {
    log('enhancePrompt error:', err);
    button.innerHTML = icons.wand;
    button.classList.remove('loading');
    return null;
  }
};

// ─── VISIBILITY CHECK ─────────────────────────────────────────────────────────

const isElementVisible = (el) => {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  return (
    el.offsetParent !== null &&
    rect.width > 20 &&
    rect.height > 10 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity) > 0.1 &&
    rect.left >= 0  // catches left:-9999px hidden trick
  );
};

// ─── INTERSECTION OBSERVER ────────────────────────────────────────────────────

let intersectionObserver = null;

const getIntersectionObserver = (prefs) => {
  if (intersectionObserver) return intersectionObserver;
  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && isElementVisible(entry.target)) {
        intersectionObserver.unobserve(entry.target);
        injectButtonForInput(entry.target, prefs);
      }
    });
  }, { threshold: 0.1 });
  return intersectionObserver;
};

// ─── POSITIONING ──────────────────────────────────────────────────────────────

/**
 * FIX: Use `top = rect.bottom - BUTTON_SIZE - MARGIN` instead of `bottom`.
 *
 * The previous `bottom`-based formula with a clamp caused the icon to drift
 * downward as the user scrolled inside the textarea, because it was recalculating
 * relative to viewport height on every scroll tick.
 *
 * Using `top` anchored to `rect.bottom` is stable — the input box itself doesn't
 * move when you scroll its content (it's a fixed chat bar), so the icon stays
 * locked to the bottom-right corner of the input at all times.
 */
// Finds how far the rightmost native button inside the composer is from the
// composer right edge. We place our icon just left of that button so we never
// overlap it — fully adaptive, no hardcoded offsets, works on every platform.
const getNativeButtonOffset = (composerEl) => {
  if (!composerEl) return 10;

  // Collect all buttons and icon-like elements inside the composer
  const candidates = composerEl.querySelectorAll(
    'button, [role="button"], [type="submit"], svg'
  );

  const composerRect = composerEl.getBoundingClientRect();
  let rightmostLeft = composerRect.right;

  candidates.forEach(el => {
    // Skip our own injected widget
    if (el.closest('.enhancer-widget-container')) return;
    const r = el.getBoundingClientRect();
    // Only consider elements that are actually visible and inside the composer
    if (r.width > 0 && r.height > 0 && r.left >= composerRect.left && r.right <= composerRect.right + 5) {
      if (r.left < rightmostLeft) {
        rightmostLeft = r.left;
      }
    }
  });

  // How many px from the composer right edge to the leftmost native button group
  const offset = composerRect.right - rightmostLeft;
  // Add a small gap (8px) between our icon and theirs
  return Math.max(10, offset + 8);
};

const BUTTON_SIZE = 32;
const MARGIN = 10;

// Self-calibrating composer anchor — works on every platform with zero hardcoding.
//
// Uses a multi-signal scoring system to find the real composer box regardless
// of where it sits on screen (bottom, center, sidebar, panel, etc).
//
// Signals scored per ancestor:
//   1. Tightness   — smallest element that still fully wraps the input (primary signal)
//   2. Proximity   — how close its bottom is to viewport bottom (helps for bottom composers)
//   3. Styling     — has background/border/border-radius (looks like a real input box)
//   4. Aspect      — wider than tall (composers are landscape-oriented)
//
// The ancestor with the best combined score is the real composer box.
const getComposerAnchor = (inputEl) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const inputRect = inputEl.getBoundingClientRect();

  let best = null;
  let bestScore = Infinity;

  let el = inputEl.parentElement;
  while (el && el !== document.body) {
    const r = el.getBoundingClientRect();

    // Hard filters: must be a plausible container size
    // Skip full-page wrappers (> 70% viewport height) and micro elements
    if (r.height < 20 || r.height > vh * 0.7 || r.width < 80) {
      el = el.parentElement;
      continue;
    }

    const s = window.getComputedStyle(el);

    // Signal 1: Tightness — how much extra height beyond the input itself
    // A tight wrapper scores near 0; a loose page-section scores high
    const tightness = (r.height - inputRect.height) / vh;

    // Signal 2: Proximity to viewport bottom OR viewport center
    // Works for bottom composers (ChatGPT, Gemini) AND centered composers (Claude new chat)
    const distBottom = Math.abs(vh - r.bottom) / vh;
    const distCenter = Math.abs(vh / 2 - (r.top + r.height / 2)) / vh;
    const proximity = Math.min(distBottom, distCenter);

    // Signal 3: Styled element bonus (negative score = better)
    const hasStyle = (
      s.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      parseFloat(s.borderRadius) > 0 ||
      s.boxShadow !== 'none'
    ) ? -0.05 : 0;

    // Signal 4: Aspect ratio — composers are wider than tall
    const aspectPenalty = r.height > r.width ? 0.2 : 0;

    // Combined score — lower is better
    const score = tightness * 0.5 + proximity * 0.3 + hasStyle + aspectPenalty;

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }

    el = el.parentElement;
  }

  return best;
};

const repositionWidget = (inputEl, widget) => {
  const anchor = getComposerAnchor(inputEl) || inputEl;
  const rect = anchor.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    widget.style.opacity = '0';
    widget.style.pointerEvents = 'none';
    return;
  }

  widget.style.position = 'fixed';
  // Dynamically find the rightmost native button inside the composer so we
  // can place our icon just to the left of it — no hardcoded pixel offsets.
  const nativeButtonOffset = getNativeButtonOffset(anchor);
  widget.style.right = (window.innerWidth - rect.right + MARGIN + nativeButtonOffset) + 'px';
  widget.style.top = (rect.bottom - BUTTON_SIZE - MARGIN) + 'px';
  widget.style.bottom = 'auto';
  widget.style.left = 'auto';
  widget.style.opacity = '1';
  widget.style.pointerEvents = 'auto';

  const panel = widget.querySelector('.enhancer-options-panel');
  if (panel) {
    panel.style.maxWidth = Math.min(560, rect.right - 10) + 'px';
  }
};

// ─── INJECT BUTTON ────────────────────────────────────────────────────────────

function injectButtonForInput(inputEl, prefs) {
  if (inputEl.dataset.enhancerInjected === 'true') return;
  inputEl.dataset.enhancerInjected = 'true';

  log('Injecting button for', inputEl.tagName, inputEl.className);

  const widget = document.createElement('div');
  widget.className = 'enhancer-widget-container';
  widget.style.position = 'fixed';
  widget.style.zIndex = '2147483647';

  const btn = document.createElement('button');
  btn.className = 'universal-enhancer-btn';
  btn.title = 'Enhance prompt';
  btn.innerHTML = icons.wand;

  let currentMode = prefs.mode || 'general';

  // Instant update if user changes mode in the extension popup
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enhancerMode) {
      currentMode = changes.enhancerMode.newValue;
      log('Mode updated from popup:', currentMode);
    }
  });

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = extractText(inputEl);
    if (text.trim()) {
      const enhanced = await enhancePrompt(text, btn, currentMode);
      if (enhanced) setText(inputEl, enhanced);
    }
  });

  widget.appendChild(btn);
  document.body.appendChild(widget);

  const updatePos = () => repositionWidget(inputEl, widget);
  window.addEventListener('resize', updatePos);
  window.addEventListener('scroll', updatePos, true);
  inputEl.addEventListener('input', updatePos);

  updatePos();

  const poller = setInterval(() => {
    if (!document.body.contains(inputEl)) {
      clearInterval(poller);
      widget.remove();
    } else {
      updatePos();
    }
  }, 500);
}

// ─── SCAN ─────────────────────────────────────────────────────────────────────

function scanForInputs() {
  checkPreferences((prefs) => {
    if (!prefs.enabled) return;

    let selector = [
      'textarea:not([data-enhancer-injected="true"])',
      'div[contenteditable="true"]:not([data-enhancer-injected="true"])',
      'div[contenteditable]:not([contenteditable="false"]):not([data-enhancer-injected="true"])'
    ].join(', ');

    // ChatGPT-specific: target only the real input to avoid ghost duplicates
    if (window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('openai.com')) {
      selector = 'div#prompt-textarea:not([data-enhancer-injected="true"]), textarea#prompt-textarea:not([data-enhancer-injected="true"])';
    }

    const io = getIntersectionObserver(prefs);

    document.querySelectorAll(selector).forEach(el => {
      if (el.parentElement && el.parentElement.closest('[data-enhancer-injected="true"]')) return;

      if (isElementVisible(el)) {
        injectButtonForInput(el, prefs);
      } else {
        io.observe(el);
        log('Queued off-screen input for deferred injection:', el.tagName);
      }
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  log('Initialising on', window.location.hostname);
  scanForInputs();
  const observer = new MutationObserver(() => {
    log('DOM changed, scanning…');
    scanForInputs();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

if (!checkIsAIPlatform()) {
  log('Extension disabled for this domain:', window.location.hostname);
} else {
  init();
}