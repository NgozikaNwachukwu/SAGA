// Backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get("/", (req, res) => {
  res.send("Saga backend is alive ✅ (port 5001, OpenAI connected)");
});

// Main chat route
app.post("/api/message", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { message, provider, history, tone } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field" });
    }

    const prompt = buildPrompt({ message, history, tone });
    const reply = await callOpenAI(prompt);

    return res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Error in /api/message:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong talking to the AI." });
  }
});

function buildPrompt({ message, history, tone }) {
  const historyText = Array.isArray(history)
    ? history
        .map((m) => `${m.role === "user" ? "User" : "SAGA"}: ${m.content}`)
        .join("\n")
    : "";

  let toneDescription = "";

  if (tone === "tutor") {
    toneDescription =
      "Explain like a patient tutor. Use clear steps, gentle guidance, and check for understanding.";
  } else if (tone === "pro") {
    toneDescription =
      "Explain in a concise, professional tone suitable for a university or workplace audience, but still clear and approachable.";
  } else {
    toneDescription =
      "Explain like a friendly, supportive peer using simple language and relatable examples.";
  }

  return `
You are SAGA — a texting-style AI that explains anything in clear, human language.

Tone style:
${toneDescription}

General rules:
- Be warm, encouraging, and conversational.
- Avoid heavy jargon unless you immediately explain it.
- Prefer short paragraphs and bullet points over long walls of text.
- Assume the user is smart, just unfamiliar with the topic.
- Use analogies and real-world examples whenever helpful.
- At the end, you may offer a small follow-up like:
  "If you want, I can simplify this more or give another example."

Conversation so far:
${historyText}

User's latest message:
${message}

Now answer as SAGA. Keep the reply roughly 4–8 sentences unless the user clearly asked for a long, detailed breakdown.
`;
}

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
          "You are SAGA, a friendly AI explainer that makes any topic clear and approachable.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 400,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}

// Start server on PORT 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Saga backend running on http://localhost:${PORT}`);
});
