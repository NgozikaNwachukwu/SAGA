// Frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey, I’m SAGA 👋 Text me any topic and I’ll break it down for you—clearly, simply, and conversationally.",
    },
  ]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("openai");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const quickFollowups = [
    { label: "Explain simpler", prompt: "Please explain that in simpler terms." },
    { label: "Give an example", prompt: "Give me a real-world example of this." },
    { label: "Go deeper", prompt: "Go a bit deeper into the details." },
    {
      label: "Summarize this chat",
      prompt: "Summarize this whole chat in 3–4 bullet points.",
    },
  ];

  const quickStarters = [
    `Explain recursion like I'm 12`,
    "Give me a real-world analogy for binary search",
    "Summarize Big-O in 3 bullet points",
    "Break down inflation step-by-step",
  ];

  const sendMessage = async (overrideText = null) => {
    const raw = overrideText ?? input;
    const trimmed = raw.trim();
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

  const handleSend = () => sendMessage();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickFollowup = (prompt) => sendMessage(prompt);

  const handleQuickStarter = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="app">
      <main className="chat-card">
        {/* Header */}
        <header className="header">
          <div className="title-block">
            <h1>SAGA</h1>
            <p className="tagline">
              A texting-style AI that explains anything — clearly.
            </p>
          </div>

          <div className="controls">
            <div className="control">
              <span className="control-label">Style</span>
              <select
                className="control-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="friendly">Friendly</option>
                <option value="tutor">Tutor</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div className="control">
              <span className="control-label">Model</span>
              <select
                className="control-select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="openai">OpenAI</option>
              </select>
            </div>
          </div>
        </header>

        {/* Messages */}
        <section className="messages">
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
        </section>

        {/* Quick actions */}
        <section className="quick-section">
          <div className="suggestion-row">
            <span className="quick-label">Need more help?</span>

            {quickFollowups.map((q) => (
              <div
                key={q.label}
                className="suggestion-chip"
                onClick={() => handleQuickFollowup(q.prompt)}
              >
                {q.label}
              </div>
            ))}
          </div>

          <div className="suggestion-row">
            <span className="quick-label">Try:</span>

            {quickStarters.map((q) => (
              <div
                key={q}
                className="suggestion-chip secondary-chip"
                onClick={() => handleQuickStarter(q)}
              >
                {q}
              </div>
            ))}
          </div>
        </section>

        {/* Input */}
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

        <footer className="footer">
          <p>Built with 💗 at the CS Girlies November Hackathon</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
