document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const modeSelector = document.getElementById('modeSelector');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved settings via SYNC
  chrome.storage.sync.get(['enhancerEnabled', 'enhancerMode'], (result) => {
    enableToggle.checked = result.enhancerEnabled !== false; // default true
    if (result.enhancerMode) modeSelector.value = result.enhancerMode;
  });


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

  modeSelector.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enhancerMode: e.target.value }, showSavedMsg);
  });
});
