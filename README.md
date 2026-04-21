# 🚀 Universal Prompt Enhancer

**Universal Prompt Enhancer** is a powerful Chrome Extension and Node.js Backend duo that injects an intelligent "Enhance Prompt" button natively into popular AI platforms (like ChatGPT, Claude, etc.). It intercepts your raw, unstructured prompts and passes them through an LLM to generate highly optimized, context-rich, and structured prompts designed to yield the best possible AI outputs.

---

## 🌟 Features

- **Smart Floating Widget:** Injects a dynamic, frosted-glass widget directly next to your text areas. Switch modes and toggle settings inline without ever opening an extension popup.
- **Ultra-Premium Monochromatic UI:** A striking, minimalist black-and-white aesthetic designed to feel like a high-end dev tool.
- **6 Dynamic Enhancement Domains:** 
  - 🌐 **General:** Standard, beautifully formatted markdown sections.
  - 💻 **Software Engineering (Coding):** Emphasizes clean code, architecture, edge cases, and rigid tech stack formats.
  - 🚀 **Startup/Business:** Focuses on market analysis, monetization, and MVP validation.
  - 🧠 **Data Structures & Algorithms (DSA):** Requires explicit time/space complexities, boundaries, and techniques.
  - 📊 **Presentation Mode (NEW):** Generates structured slide-deck outlines (Title, Audience, Slide-by-slide visuals & points) perfect for importing into tools like Gamma or Tome.
  - 🏋️ **Coding Practice (NEW):** Generates authentic real-world engineering challenges with strict constraints, edge cases, and expected outputs.
- **Auto-Enhance Mode (⚡):** Sit back and let the extension automatically debounce and enhance your prompt when you stop typing.
- **Strict Markdown Enforcement:** All AI outputs use bulleted lists and `###` headers for pristine readability without conversational filler.
- **Blazing Fast:** Powered by `llama-3.1-8b-instant` via Groq.

---

## 📂 Project Structure

This repository is split into two primary components:

1. **`extension/`**: The frontend Chrome Extension (Manifest V3) that handles the UI, prompt extraction, history storage, and API communication.
2. **`backend/`**: A lightweight Node.js/Express server that securely interfaces with the Groq API (via OpenAI SDK proxy) to process and restructure the prompts.

---

## 🛠️ Setup & Installation

### 1. Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create an environment file (`.env`) based on the `.env.example`:
   ```env
   OPENAI_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
   *(Note: This project is configured to proxy the standard OpenAI SDK to the Groq API. Just provide your Groq API key here!)*

4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Installing the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** in the top right corner.
3. Click on **Load unpacked**.
4. Select the `extension/` folder from this repository.
5. The extension is now active! The background service worker will automatically ping your backend at `http://localhost:3000/enhance` during development (or your production Render URL).

---

## 🚀 Deployment

The backend is fully designed out-of-the-box to be deployed continuously on [Render](https://render.com/).

1. Connect this GitHub repository to Render (Web Service).
2. Set the **Root Directory** to `backend`.
3. Set your internal build commands:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set the `OPENAI_API_KEY` in the Render Environment Variables dashboard.
5. Once your backend is live, update the `fetch` URL inside `extension/background.js` to point to your new live Render URL!

---

## 🛠️ Tech Stack
* **Frontend:** Manifest V3, Vanilla JavaScript, HTML/CSS.
* **Backend:** Node.js, Express, CORS.
* **AI Provider:** Groq (Proxying OpenAI SDK using `llama-3.1-8b-instant`).

## 📜 License
This project is open-source. Feel free to modify and use it for your personal workflow or portfolio.
