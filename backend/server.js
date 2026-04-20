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
Your goal is to take the user's raw, unstructured prompt and completely rewrite it into a highly optimized, structured prompt capable of producing the best possible AI output.

Regardless of what the user says, YOU MUST ONLY return the optimized prompt itself. Do NOT include phrases like "Here is your optimized prompt:" or any conversational text.

The optimized prompt MUST contain the following structured sections natively integrated:
- **Goal:** [Clear definition of what needs to be achieved]
- **Context:** [Relevant background information]
- **Requirements:** [Actionable steps or constraints]
- **Output Format:** [How the response should look e.g. markdown table, steps, etc]`;

  if (mode === 'coding') {
    return baseSystem + `\n\nFor Software Engineering mode, heavily emphasize clean code, architecture, edge-cases, error-handling, and strict adherence to modern frameworks/practices. Specify the tech stack vividly and clearly. Require output to include necessary dependencies and inline code documentation.`;
  }

  if (mode === 'startup') {
    return baseSystem + `\n\nFor Startup/Business idea mode, heavily emphasize market analysis, target audience, monetization strategies, structured step-by-step validation, MVP features, and competitive advantages. Require output to be formatted in clear business plan sections.`;
  }

  if (mode === 'dsa') {
    return baseSystem + `\n\nFor DSA (Data Structures & Algorithms) mode, heavily emphasize defining explicitly: input/output boundaries, time complexity constraints (Big O), space complexity constraints, algorithm techniques to explore (e.g. DP, Sliding Window), and edge cases to test.`;
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
      model: "llama3-8b-8192", // Fast model
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
