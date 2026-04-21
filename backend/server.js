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
  const baseSystem = `You are a professional Prompt Engineer.
Transform the user's input into a high-quality, structured "Mega-prompt" for ChatGPT/Claude.

STRICT CONSTRAINTS:
1. NO INTROS/OUTROS (don't say "Here is your prompt").
2. USE TOKEN-EFFICIENT MARKDOWN (concise headers, no extra fluff).
3. GOAL: Maximize the utility of every credit.

Structure:
### Role & Persona
Act as [X]. 
### Task Description
[Detailed but concise task].
### Requirements
- [Mandatory constraint 1]
- [Mandatory constraint 2]
### Output Formatting
[Strict output structure].`;

  if (mode === 'coding') {
    return baseSystem + `\nFocus: Clean architecture, modularity, and error-handling.`;
  }

  if (mode === 'startup') {
    return baseSystem + `\nFocus: Market validation, monetization, and MVP urgency.`;
  }

  if (mode === 'dsa') {
    return baseSystem + `\nFocus: Optimality, Big O complexity, and edge-case coverage.`;
  }

  if (mode === 'presentation') {
    return baseSystem + `\nFocus: Compelling slide-by-slide narrative structure (Topic -> Key Points -> Visuals).`;
  }

  if (mode === 'coding_practice') {
    return baseSystem + `\nFocus: Real-world practical challenges with clear starting points and success criteria.`;
  }

  return baseSystem;
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
