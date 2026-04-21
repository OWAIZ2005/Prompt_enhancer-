require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Init OpenAI
// If using Groq, adjust the baseURL and pass GROQ_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});
const getSystemPrompt = (mode) => {
  const baseSystem = `You are a world-class Prompt Engineer. 
Your goal is to take the user's raw, unstructured prompt and completely rewrite it into a highly optimized, structured, and beautiful prompt capable of producing the best possible AI output.

Regardless of what the user says, YOU MUST ONLY return the optimized prompt itself. Do NOT include conversational filler like "Here is your optimized prompt:".

IMPORTANT FORMATTING RULES:
1. Use elegant Markdown structure with clean sections (### Headers).
2. Utilize bulleted lists (*) for readability, avoiding dense paragraphs.
3. Bold important keywords to make them stand out.
4. Keep the presentation visually appealing and professional.

Ensure the prompt contains these native sections:
### 🎯 Goal
[Clear statement of what needs to be achieved]

### 📖 Context
[Actionable background info, structured cleanly in bullet points]

### ⚙️ Requirements & Constraints
* [Strict, actionable requirement 1]
* [Strict, actionable requirement 2]
* ...

### 📋 Output Format
[Explicit structure for how the final AI output should look]`;

  if (mode === 'coding') {
    return baseSystem + `\n\nAdditionally, for Software Engineering mode:
- Add a "### 💻 Tech Stack" section at the top.
- Emphasize clean architecture, modular code, and error-handling in the Requirements.
- Mandate inline code documentation and edge-case coverage.`;
  }

  if (mode === 'startup') {
    return baseSystem + `\n\nAdditionally, for Startup/Business mode:
- Add sections for "### 🚀 Target Audience" and "### 💡 Value Proposition".
- Emphasize validation, monetization, and concrete MVP steps in the Requirements.
- Use a professional, persuasive tone suitable for pitch-creation.`;
  }

  if (mode === 'dsa') {
    return baseSystem + `\n\nAdditionally, for DSA mode:
- Add explicit sections: "### 📥 Input/Output Boundaries", "### ⏱️ Time/Space Complexity", and "### 🧪 Edge Cases".
- Emphasize mathematical correctness and the exploration of multiple approaches.`;
  }

  if (mode === 'presentation') {
    return baseSystem + `\n\nAdditionally, for Presentation mode (e.g. Gamma/Tome):
- Transform the output into a slide-deck structure.
- Include an "### 🎯 Objective" and "### 👥 Target Audience" section.
- Output a "### 📊 Slide-by-Slide Breakdown", where each slide has a title, key bullet points, and optional visual suggestions.`;
  }

  if (mode === 'coding_practice') {
    return baseSystem + `\n\nAdditionally, for Coding Practice mode:
- Construct a real-world coding challenge (beyond just DSA).
- Include strict sections: "### 🏢 Real-world Context", "### ⚙️ Constraints / Edge Cases", "### 🎯 Expected Output", and "### 💡 Optional Hints".
- Emphasize practical application, problem-solving, and clean coding paradigms.`;
  }

  return baseSystem; // Default 'general' mode
};

app.post('/enhance', async (req, res) => {
  const { raw_prompt, mode } = req.body;

  if (!raw_prompt || typeof raw_prompt !== 'string') {
    return res.status(400).json({ error: 'You must provide a valid "raw_prompt" in the JSON body.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: OPENAI_API_KEY is not set.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: getSystemPrompt(mode || 'general') },
        { role: "user", content: `Raw Prompt:\n\n${raw_prompt}` }
      ],
      temperature: 0.7,
    });

    const enhanced = completion.choices[0].message.content.trim();
    res.json({ enhanced_prompt: enhanced });

  } catch (error) {
    console.error("OpenAI API Error:", error.message || error);
    res.status(500).json({ error: 'Failed to enhance prompt. Check server logs.' });
  }
});

app.listen(PORT, () => {
  console.log(`Universal Prompt Enhancer Backend is running at http://localhost:${PORT}`);
  console.log(`Accepting POST requests to http://localhost:${PORT}/enhance\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  WARNING: OPENAI_API_KEY is missing from your .env file!");
  }
});
