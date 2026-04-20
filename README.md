# Universal Prompt Enhancer

A complete, production-ready Chrome Extension and Node.js backend that enhances user prompts across any AI platform.

## 🚀 Architecture

- **/extension**: The Chrome Extension (Frontend). Uses no frameworks, pure Vanilla JS. Uses `MutationObserver` to locate input elements and injects a clean, styled button.
- **/backend**: The Node.js Express server. Responsible for receiving raw prompts safely and interacting with the OpenAI API. 

---

## 🛠️ Setup Instructions

### 1. Backend Setup

The Extension relies on a local backend to communicate securely with AI and prevent exposing API keys to the browser.

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Contextualize Environment Variables:
   - Copy `.env.example` and rename it to `.env`.
   - Open `.env` and assign your actual API key:
     ```env
     OPENAI_API_KEY=sk-...your_key...
     PORT=3000
     ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *You should see a message saying:* `Universal Prompt Enhancer Backend is running at http://localhost:3000`

---

### 2. Chrome Extension Setup

Since this is an unpackaged extension during development, follow these steps to load it into Chrome:

1. Open your Google Chrome browser.
2. Navigate to your extensions page by typing this directly into the URL bar and hitting Enter:
   `chrome://extensions/`
3. In the top-right corner, ensure **"Developer mode"** is toggled ON.
4. In the top-left corner, click **"Load unpacked"**.
5. A file dialog will open. Select the `extension` folder located inside this `prompt_manager` directory.
6. The "Universal Prompt Enhancer" icon should now appear in your list of extensions!

---

## 🧪 Testing the Integration

1. Check that your Node.js backend is currently running in your terminal.
2. Navigate to an AI website (e.g., [ChatGPT](https://chatgpt.com) or [Claude](https://claude.ai)).
3. Inside the chat input window, you will see a subtle, gradient **"Enhance"** button inject itself at the bottom right.
4. Type a basic prompt like: `"build app"`
5. Click **"Enhance"**.
6. The button will show a loading state... and replace your text inside the input box with a richly structured prompt!
7. **Optional:** Click the Chrome Extension icon (top right browser bar) to open the Popup window. Here you can toggle the extension on/off or change the styling mode (e.g., "Software Engineering").

Enjoy!
