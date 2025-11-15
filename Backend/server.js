// backend/server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/", (req, res) => {
  res.send("Saga backend is alive ✅ (port 5001)");
});

// Main chat route used by the frontend
app.post("/api/message", (req, res) => {
  console.log("Incoming request body:", req.body);

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'message' field" });
  }

  // For now just echo + placeholder
  const reply = `[Placeholder] You asked: "${message}". This is where the AI explanation will go.`;

  return res.json({ reply });
});

// Start the server on PORT 5001 (NOT 5000)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Saga backend running on http://localhost:${PORT}`);
});
