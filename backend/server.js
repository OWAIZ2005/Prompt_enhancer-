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
  const baseSystem = `You are an expert Prompt Compressor.
Your ONLY goal is to transform the user's raw prompt into an ultra-dense, token-efficient "Mega-prompt" that provides maximum context to an LLM with the fewest possible words.

STRICT RULES:
1. ONLY return the compressed prompt. No filler like "Here is your prompt."
2. DO NOT use verbose Markdown headers (e.g. ### 🎯 Goal) or space-wasting bulleted lists.
3. Use a dense, cohesive block format natively understood by AI: "Role: [X]. Context: [Y]. Task: [Z]. Constraints: [C]."
4. Compress phrasing: Instead of "You must make sure there are no bugs", use "Ensure zero bugs."

Core Structure (Merge these tight sentences together):
Role: World-class AI assistant.
Task: [Actionable task].
Context: [Necessary background].
Format: [Clear expected output format].`;

  if (mode === 'coding') {
    return baseSystem + `\nConstraints: Strictly emphasize clean architecture, modular code, documented edge-cases, and rigid tech-stack adherence. Output pure code logic without generic explanations.`;
  }

  if (mode === 'startup') {
    return baseSystem + `\nConstraints: Focus strictly on target demographic evaluation, market validation, monetization strategies, and concise MVP steps. Maintain a persuasive, business-centric tone.`;
  }

  if (mode === 'dsa') {
    return baseSystem + `\nConstraints: Explicitly demand time/space complexity analysis (Big O), rigorous edge-case boundary testing, and mathematically optimal algorithm structures.`;
  }

  if (mode === 'presentation') {
    return baseSystem + `\nConstraints: Transform the output into a pure slide-deck outline. Provide Target Audience, then immediately list Slides (Slide 1: [Title] - [1 sentence key points] - [1 visual suggestion]). Do not waste tokens on long descriptions.`;
  }

  if (mode === 'coding_practice') {
    return baseSystem + `\nConstraints: Construct a real-world software engineering challenge. Provide compact Real-world Context, Strict Constraints, Expected Output specs, and 1 Optional Hint.`;
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
