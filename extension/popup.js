document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const autoEnhanceToggle = document.getElementById('autoEnhanceToggle');
  const modeSelector = document.getElementById('modeSelector');
  const statusMessage = document.getElementById('statusMessage');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Load saved settings via SYNC
  chrome.storage.sync.get(['enhancerEnabled', 'autoEnhance', 'enhancerMode'], (result) => {
    enableToggle.checked = result.enhancerEnabled !== false; // default true
    autoEnhanceToggle.checked = result.autoEnhance === true; // default false
    if (result.enhancerMode) modeSelector.value = result.enhancerMode;
  });

  // Load history via LOCAL
  const loadHistory = () => {
    chrome.storage.local.get(['promptHistory'], (result) => {
      const history = result.promptHistory || [];
      renderHistory(history);
    });
  };

  const renderHistory = (history) => {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-msg">No history yet.</p>';
      return;
    }

    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      
      const text = document.createElement('p');
      text.className = 'history-text';
      text.textContent = item;
      
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(item);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      };
      
      actions.appendChild(copyBtn);
      div.appendChild(text);
      div.appendChild(actions);
      historyList.appendChild(div);
    });
  };

  const showSavedMsg = () => {
    statusMessage.textContent = "Sync saved!";
    statusMessage.style.color = "#4caf50";
    setTimeout(() => {
      statusMessage.textContent = "Settings sync across devices.";
      statusMessage.style.color = "#a0aab8";
    }, 2000);
  };

  // Sync Listeners
  enableToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enhancerEnabled: e.target.checked }, showSavedMsg);
  });

  autoEnhanceToggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ autoEnhance: e.target.checked }, showSavedMsg);
  });

  modeSelector.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enhancerMode: e.target.value }, showSavedMsg);
  });

  // Local Listeners
  clearHistoryBtn.addEventListener('click', () => {
    chrome.storage.local.set({ promptHistory: [] }, () => {
      loadHistory();
    });
  });

  // Init
  loadHistory();
});
