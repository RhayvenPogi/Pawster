import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMessaging } from "../hooks/useMessaging";

function PawWatermark({ style }) {
  return (
    <svg style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <ellipse cx="50" cy="66" rx="24" ry="21" />
      <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)" />
      <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)" />
      <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)" />
      <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)" />
    </svg>
  );
}

function Bubble({ msg, userId }) {
  // A message is "mine" if I sent it — check both senderId and senderRole
  const isMine =
    (msg.senderId != null && String(msg.senderId) === String(userId)) ||
    (msg.senderId == null && msg.senderRole !== "admin");

  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
        style={{
          background: isMine
            ? "linear-gradient(135deg,#1c4f09,#3a8a18)"
            : "linear-gradient(135deg,#B45A22,#e07820)",
        }}
      >
        {isMine ? "You" : "🐾"}
      </div>

      <div className={`max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className="px-4 py-2.5 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm"
          style={{
            background: isMine
              ? "linear-gradient(135deg,rgba(28,79,9,0.92),rgba(58,138,24,0.88))"
              : "rgba(255,250,232,0.95)",
            color: isMine ? "#fff" : "#1a2e0a",
            borderBottomRightRadius: isMine ? 4 : undefined,
            borderBottomLeftRadius: !isMine ? 4 : undefined,
            border: isMine ? "none" : "1.5px solid rgba(180,140,60,0.28)",
          }}
        >
          {msg.content}
        </div>
        <span className="text-[10px] font-semibold" style={{ color: "#9aaa80" }}>
          {time}
        </span>
      </div>
    </div>
  );
}

export default function MessagingPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const {
    messages,
    connected,
    loadHistory,
    sendMessage,
    markRead,
  } = useMessaging(user);

  // Load history and mark read once user is available
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadHistory();
    markRead();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#EDDABB", fontFamily: "'Nunito', sans-serif" }}
    >
      <PawWatermark style={{ position: "fixed", bottom: -60, right: -40, width: 300, opacity: 0.05, color: "#1c4f09", pointerEvents: "none", zIndex: 0 }} />
      <PawWatermark style={{ position: "fixed", top: 80, left: -30, width: 200, opacity: 0.04, color: "#B45A22", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 h-[64px] shadow-sm"
        style={{
          background: "rgba(255,248,218,0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1.5px solid rgba(90,170,48,0.35)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(28,79,9,0.08)] transition-all"
          style={{ color: "#1c4f09" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-[#5aaa30]"
          style={{ background: "linear-gradient(135deg,#B45A22,#e07820)" }}
        >
          🐾
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-black text-[#1a4a08] text-[0.95rem]">Pawster Support</div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: connected ? "#4ccc20" : "#ccc" }}
            />
            <span
              className="text-[0.72rem] font-bold"
              style={{ color: connected ? "#3a8a18" : "#9aaa80" }}
            >
              {connected ? "Online" : "Connecting…"}
            </span>
          </div>
        </div>

        <PawWatermark style={{ width: 28, opacity: 0.25, color: "#1c4f09" }} />
      </header>

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto px-4 py-5 relative z-10"
        style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4 text-center">
            <PawWatermark style={{ width: 80, opacity: 0.15, color: "#1c4f09" }} />
            <p className="text-[0.95rem] font-bold" style={{ color: "#6a8a50" }}>
              No messages yet
            </p>
            <p className="text-sm font-semibold" style={{ color: "#9aaa80", maxWidth: 280 }}>
              Send a message to the Pawster team — we're here to help with adoptions, rehoming, and more.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} userId={user.id} />
          ))
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer
        className="sticky bottom-0 z-20 px-4 py-3"
        style={{
          background: "rgba(255,248,218,0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1.5px solid rgba(180,140,60,0.28)",
        }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2 max-w-[720px] mx-auto"
          style={{
            background: "rgba(255,252,238,0.85)",
            border: "1.5px solid rgba(180,140,60,0.35)",
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-semibold leading-relaxed"
            style={{
              color: "#1a2e0a",
              minHeight: 28,
              maxHeight: 120,
              fontFamily: "'Nunito', sans-serif",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background:
                input.trim() && connected
                  ? "linear-gradient(135deg,#1c4f09,#2a7010)"
                  : "rgba(180,140,60,0.18)",
              color: input.trim() && connected ? "#fff" : "#9aaa80",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p
          className="text-center text-[10px] font-semibold mt-1.5"
          style={{ color: "#b0a07a" }}
        >
          Press Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}