// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

// Default welcome message if no saved chat
const DEFAULT_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hey, I’m SAGA 👋 Text me any topic and I’ll break it down for you, clearly, simply, and conversationally.",
  },
];

function App() {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("openai");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark"); // "dark" | "light"
  const [tone, setTone] = useState("friend"); // "friend" | "tutor" | "pro"

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const suggestedPrompts = [
    'Explain recursion like I\'m 12',
    "Give me a real-world analogy for binary search",
    "Summarize Big-O in 3 bullet points",
    "Break down inflation step-by-step",
  ];

  // Load saved conversation from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("saga-messages");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (_) {
        // ignore parse errors and fall back to default
      }
    }
  }, []);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("saga-messages", JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendToSaga = async ({ content, historyOverride }) => {
    const newMessages = historyOverride || [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          provider,
          history: newMessages,
          tone,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const replyText =
        data.reply ||
        "Hmm, I couldn’t come up with anything. Try asking in a slightly different way?";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, something went wrong talking to the server. Check your connection or try again in a bit.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    await sendToSaga({ content: trimmed });
  };

  const handleRefine = async (mode) => {
    if (loading) return;

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistant) return;

    let refinementInstruction = "";

    if (mode === "simpler") {
      refinementInstruction =
        "Explain the last answer in simpler terms, like you're explaining it to someone new to the topic.";
    } else if (mode === "example") {
      refinementInstruction =
        "Give a concrete, real-world example to help me understand the last answer.";
    } else if (mode === "deeper") {
      refinementInstruction =
        "Go deeper into the last answer and add more technical detail while still keeping it clear.";
    }

    await sendToSaga({ content: refinementInstruction });
  };

  const handleSummary = async () => {
    if (loading || messages.length === 0) return;

    const summaryPrompt =
      "Please summarize everything we've discussed so far into a short, structured study guide. Use headings and bullet points where it helps.";

    await sendToSaga({ content: summaryPrompt });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const truncated = text.slice(0, 3000); // keep it reasonable

    setInput(`Explain this text for me:\n\n${truncated}`);
  };

  return (
    <div className={`app ${theme}`}>
      <header className="header">
        <div className="header-left">
          <h1>SAGA</h1>
          <p className="tagline">
            A texting-style AI that explains anything — clearly.
          </p>
        </div>

        <div className="header-right">
          <div className="tone-selector">
            <label htmlFor="tone-select">Style:</label>
            <select
              id="tone-select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading}
            >
              <option value="friend">Friendly</option>
              <option value="tutor">Tutor</option>
              <option value="pro">Professional</option>
            </select>
          </div>

          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          <select
            className="provider-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="claude" disabled>
              Claude (coming soon)
            </option>
          </select>
        </div>
      </header>

      <main className="chat-card">
        <div className="messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`message-row ${
                m.role === "user" ? "user-row" : "assistant-row"
              }`}
            >
              <div
                className={`bubble ${
                  m.role === "user" ? "user-bubble" : "assistant-bubble"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant-row">
              <div className="bubble assistant-bubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Refinement + summary actions */}
        <div className="refine-row">
          <span className="refine-label">Need more help?</span>
          <button
            onClick={() => handleRefine("simpler")}
            disabled={loading || messages.length === 0}
          >
            Explain simpler
          </button>
          <button
            onClick={() => handleRefine("example")}
            disabled={loading || messages.length === 0}
          >
            Give an example
          </button>
          <button
            onClick={() => handleRefine("deeper")}
            disabled={loading || messages.length === 0}
          >
            Go deeper
          </button>
          <button
            className="summary-btn"
            onClick={handleSummary}
            disabled={loading || messages.length === 0}
          >
            📝 Summarize this chat
          </button>
        </div>

        {/* Suggested prompts */}
        <div className="suggested-row">
          <span className="suggested-label">Try:</span>
          {suggestedPrompts.map((text, idx) => (
            <button
              key={idx}
              className="suggested-chip"
              onClick={() => setInput(text)}
              disabled={loading}
            >
              {text}
            </button>
          ))}
        </div>

        {/* Upload text file helper */}
        <div className="upload-row">
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={loading}
            className="upload-btn"
          >
            📁 Upload .txt to explain
          </button>
          <input
            type="file"
            accept=".txt"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Input area */}
        <div className="input-row">
          <textarea
            className="input"
            placeholder='Ask anything: "explain Big-O", "what is inflation", "why is the sky blue?"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </main>

      <footer className="footer">
        <p>Built with 💗 at the CS Girlies November Hackathon</p>
      </footer>
    </div>
  );
}

export default App;
