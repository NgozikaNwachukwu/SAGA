// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey, I’m SAGA 👋 Text me any topic and I’ll break it down for you, clearly, simply, and conversationally."
    }
  ]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("openai");
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

    // Add user message to chat
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

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>SAGA</h1>
          <p className="tagline">
            A texting-style AI that explains anything — clearly.
          </p>
        </div>

        <select
          className="provider-select"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
        </select>
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
                SAGA is typing…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
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
