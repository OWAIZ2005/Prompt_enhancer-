const DEV_MODE_ENABLED = true;

const log = (...args) => {
  if (DEV_MODE_ENABLED) {
    console.log('[Prompt Enhancer V2 bg-worker]:', ...args);
  }
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ENHANCE_PROMPT") {
    log(`Received request to enhance prompt in mode: ${request.mode}`);
    // We must return true to indicate we will send a response asynchronously
    handleEnhancePrompt(request.prompt, request.mode)
      .then(data => {
        log("Successfully received response from backend");
        sendResponse(data);
      })
      .catch(error => {
        log("Error pinging backend:", error.message);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function handleEnhancePrompt(prompt, mode) {
  try {
    const response = await fetch('https://prompt-enhancer-vms9.onrender.com/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw_prompt: prompt, mode: mode })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return { enhancedPrompt: data.enhanced_prompt };
  } catch (error) {
    log("Fetch fetch error:", error);
    return { error: error.message || 'Failed to connect to backend server. Make sure it is running on http://localhost:3000' };
  }
}
