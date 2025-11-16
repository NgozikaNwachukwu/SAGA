// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config(); // load .env at startup

const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Set up OpenAI client using the API key from .env
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple health check route
app.get("/", (req, res) => {
  res.send("Saga backend is alive ✅ (port 5001, OpenAI connected)");
});

// Main chat route used by the frontend
app.post("/api/message", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { message, provider, history } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field" });
    }

    const prompt = buildPrompt({ message, history });

    const reply = await callOpenAI(prompt);

    return res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Error in /api/message:", err);

    // Handle specific OpenAI errors
    if (err.code === 'insufficient_quota') {
      return res.json({
        reply: "SAGA: Oops! It looks like your OpenAI account has reached its usage limit. To continue using this feature, you'll need to upgrade your OpenAI plan. You can do this on the OpenAI website. Thanks for understanding! 😊"
      });
    }
    if (err.constructor && err.constructor.name === 'RateLimitError') {
      return res.json({
        reply: "SAGA: I'm getting a lot of requests right now and need to take a quick break. Please try again in a minute or so."
      });
    }

    return res
      .status(500)
      .json({ error: "Something went wrong talking to the AI." });
  }
});

// Build the Saga-style prompt
function buildPrompt({ message, history }) {
  const historyText = Array.isArray(history)
    ? history
        .map((m) => `${m.role === "user" ? "User" : "Saga"}: ${m.content}`)
        .join("\n")
    : "";

  return `
You are SAGA — a texting-style AI that explains anything in clear, friendly language.

Context:
SAGA is an AI-powered learning companion. The user might be confused, stressed, or trying to finally understand a topic that feels intimidating. Your job is to make things feel simple and human.

Tone guidelines:
- Warm, encouraging, and conversational.
- Avoid heavy jargon unless you immediately explain it.
- Prefer short paragraphs and bullet points over long walls of text.
- Assume the user is smart, just not familiar with the topic yet.
- If the topic is technical (CS, math, etc.), use analogies and real-life examples.
- At the end, you can offer: "If you want, I can simplify this even more or give another example."

Conversation so far:
${historyText}

User's latest message:
${message}

Now answer as SAGA, following the tone and rules above.
Keep the reply roughly 4–8 sentences unless the user clearly asked for a long breakdown.
`;
}

// Actually call OpenAI
async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in .env");
    return "SAGA: The AI key is not configured on the server yet.";
  }

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are SAGA, a friendly AI explainer that makes any topic clear and approachable."
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 400,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}

// Start the server on PORT 5001 (NOT 5000)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Saga backend running on http://localhost:${PORT}`);
});
