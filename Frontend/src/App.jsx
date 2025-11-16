// Frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const SUGGESTIONS = [
  'Explain recursion like I\'m 12',
  'Give me a real-world analogy for binary search',
  'Summarize Big-O in 3 bullet points',
  'Break down inflation step-by-step'
];

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey, I’m SAGA 👋 Text me any topic and I’ll break it down for you—clearly, simply, and conversationally."
    }
  ]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("openai");
  const [style, setStyle] = useState("friendly");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // auto scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          provider,
          style,
          history: newMessages
        })
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const replyText =
        data.reply ||
        "Hmm, I couldn’t come up with anything. Try asking in a slightly different way?";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, something went wrong talking to the server. Check your connection or try again in a bit."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>SAGA</h1>
          <p className="tagline">
            A texting-style AI that explains anything — clearly.
          </p>
        </div>

        {/* Top-right controls (no light/dark toggle) */}
        <div className="header-controls">
          <div className="control">
            <label className="control-label">Style</label>
            <select
              className="select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="friendly">Friendly</option>
              <option value="study_buddy">Study buddy</option>
              <option value="concise">Concise</option>
              <option value="affirming">Affirming</option>
            </select>
          </div>

          <div className="control">
            <label className="control-label">Model</label>
            <select
              className="select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
            </select>
          </div>
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
                className={`message-bubble ${
                  m.role === "user" ? "user-bubble" : "saga-bubble"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant-row">
              <div className="message-bubble saga-bubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* “Need more help?” actions bar – no upload button */}
        <div className="followups">
          <span className="followups-label">Need more help?</span>
          <button className="followup-link">Explain simpler</button>
          <button className="followup-link">Give an example</button>
          <button className="followup-link">Go deeper</button>
          <button className="followup-link">Summarize this chat</button>
        </div>

        {/* Suggestions row – nicer chips, not a huge box */}
        <div className="suggestions">
          <span className="suggestions-label">Try:</span>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="suggestion-pill"
              type="button"
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </button>
          ))}
        </div>

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
