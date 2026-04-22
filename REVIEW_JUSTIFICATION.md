# Permission Justification for Reviewers

## Extension: Universal Prompt Enhancer
**Version:** 2.0.0

### Requested Permission: `<all_urls>` (Host Permissions)

**Justification:**
The Universal Prompt Enhancer is designed to provide a consistent, integrated prompt-improvement UI across a wide variety of AI/LLM platforms (including ChatGPT, Gemini, Claude, Perplexity, Poe, and Microsoft Copilot).

To achieve its core functionality, the extension requires access to these platforms to inject its UI components (a "Magic Wand" enhancement button) directly into the message input fields. 

**Why not specific host permissions?**
1. **Dynamic Platform Evolution**: New AI and LLM platforms are emerging almost weekly (e.g., DeepSeek, Mistral, Groq). Using `<all_urls>` allows the extension to provide immediate value on new platforms through its integrated "Hybrid Detection" engine without requiring constant manifest updates and disruptive permission re-approvals for users.
2. **Subdomain Diversity**: Many AI tools use varied subdomain structures (e.g., `chat.example.ai`, `app.example.ai`, `t3.example.ai`) that fluctuate during beta testing phases. Broad host permissions ensure the tool remains functional during these transitions.

### Safety & Respect for User Privacy
The extension implements a **Strict Hybrid Awareness** mechanism in its content script:
1. **Whitelist Enforcement**: It first checks against a known whitelist of AI domains.
2. **Heuristic Fallback**: If the domain is unknown, it checks for AI-specific metadata (`og:title` or `description` containing "AI Assistant", "LLM", or "Chatbot") to verify the context.
3. **Early Exit**: If a domain does not match these AI-specific criteria, the extension **terminates its execution immediately**. It does not interact with, read data from, or modify any unrelated websites (e.g., banking, social media, or personal blogs).

This approach ensures a seamless "Universal" experience while maintaining a very narrow and safe operational footprint.
