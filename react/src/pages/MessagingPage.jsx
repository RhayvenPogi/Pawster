import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMessaging } from "../hooks/useMessaging";

const PH_LOCALE = "en-PH";
const PH_TZ     = "Asia/Manila";

function formatTime(dt) {
  if (!dt) return "";
  const d   = new Date(dt);
  const now = new Date();
  const sameDay =
    d.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ }) ===
    now.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ });
  if (sameDay)
    return d.toLocaleTimeString(PH_LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: PH_TZ });
  return d.toLocaleDateString(PH_LOCALE, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: PH_TZ,
  });
}

function sameDayCheck(a, b) {
  if (!a || !b) return false;
  return (
    new Date(a).toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ }) ===
    new Date(b).toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ })
  );
}

function formatDivider(dt) {
  if (!dt) return "";
  const d    = new Date(dt);
  const now  = new Date();
  const diff = (now - d) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString(PH_LOCALE, {
    weekday: "long", month: "short", day: "numeric", timeZone: PH_TZ,
  });
}

function bubbleRadius(isMine, isFirst, isLast) {
  if (isMine) {
    return `16px ${isFirst ? "4px" : "16px"} ${isLast ? "4px" : "16px"} 16px`;
  } else {
    return `${isFirst ? "4px" : "16px"} 16px 16px ${isLast ? "4px" : "16px"}`;
  }
}

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

function SendingSpinner() {
  return (
    <>
      <style>{`@keyframes _msgspin { to { transform: rotate(360deg); } }`}</style>
      <svg
        width="10" height="10" viewBox="0 0 10 10"
        style={{ animation: "_msgspin 0.8s linear infinite", flexShrink: 0 }}
      >
        <circle
          cx="5" cy="5" r="4"
          fill="none" stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5" strokeDasharray="18" strokeDashoffset="6" strokeLinecap="round"
        />
      </svg>
    </>
  );
}

function ReadTicks({ read }) {
  const color = read ? "#4ade80" : "rgba(255,255,255,0.35)";
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 4l3 3L10 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4l3 3 6-6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateDivider({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "14px 0 10px",
        userSelect: "none",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(180,140,60,0.2)" }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#b0a07a",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(180,140,60,0.2)" }} />
    </div>
  );
}

function Bubble({ msg, userId, isFirst, isLast }) {
  const isMine =
    (msg.senderId != null && String(msg.senderId) === String(userId)) ||
    (msg.senderId == null && msg.senderRole !== "admin");

  return (
    <div
      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      style={{ marginBottom: isLast ? 10 : 3 }}
    >
      {/* Avatar: only on last bubble of a run */}
      {isLast ? (
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
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      <div
        className={`max-w-[72%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
      >
        <div
          className="px-4 py-2.5 text-sm font-semibold leading-relaxed"
          style={{
            borderRadius: bubbleRadius(isMine, isFirst, isLast),
            background: isMine
              ? "linear-gradient(135deg,rgba(28,79,9,0.92),rgba(58,138,24,0.88))"
              : "rgba(255,250,232,0.95)",
            color: isMine ? "#fff" : "#1a2e0a",
            border: isMine ? "none" : "1.5px solid rgba(180,140,60,0.28)",
            wordBreak: "break-word",
            opacity: msg.pending ? 0.55 : 1,
            transition: "opacity 0.25s ease",
            boxShadow: isMine
              ? "inset 0 1px 0 rgba(255,255,255,0.08)"
              : "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {msg.content}
        </div>

        {/* Meta row: only on last bubble of a run */}
        {isLast && (
          <div
            className="flex items-center gap-1"
            style={{
              paddingInline: 3,
              justifyContent: isMine ? "flex-end" : "flex-start",
            }}
          >
            {msg.pending ? (
              <>
                <SendingSpinner />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9aaa80" }}>sending…</span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold" style={{ color: "#9aaa80" }}>
                  {formatTime(msg.createdAt)}
                </span>
                {isMine && <ReadTicks read={msg.read ?? false} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagingPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [input, setInput] = useState("");
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const {
    messages,
    setMessages,
    connected,
    loadHistory,
    sendMessage,
    markRead,
  } = useMessaging(user);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadHistory();
    markRead();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected) return;

    const tempId = `pending-${Date.now()}`;
    const optimistic = {
      id: tempId,
      content: text,
      senderId: user.id,
      senderRole: "user",
      createdAt: new Date().toISOString(),
      pending: true,
      read: false,
    };
    setMessages(prev => [...prev, optimistic]);

    sendMessage(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    // Fallback: resolve pending after 3s if WS ack hasn't replaced it
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, pending: false } : m)
      );
    }, 3000);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  // Build enriched list: date dividers + isFirst/isLast grouping flags
  const enriched = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];

    // Determine sender key: user messages group by senderId, admin by role
    const senderKey = msg.senderRole === "admin"
      ? "admin"
      : String(msg.senderId ?? "user");
    const prevKey = prev
      ? (prev.senderRole === "admin" ? "admin" : String(prev.senderId ?? "user"))
      : null;
    const nextKey = next
      ? (next.senderRole === "admin" ? "admin" : String(next.senderId ?? "user"))
      : null;

    if (!prev || !sameDayCheck(prev.createdAt, msg.createdAt)) {
      enriched.push({ type: "divider", key: `div-${msg.id}`, label: formatDivider(msg.createdAt) });
    }

    const isFirst = !prev || prevKey !== senderKey || !sameDayCheck(prev.createdAt, msg.createdAt);
    const isLast  = !next || nextKey !== senderKey || !sameDayCheck(msg.createdAt, next?.createdAt);

    enriched.push({ type: "bubble", msg, isFirst, isLast });
  });

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
        {enriched.length === 0 ? (
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
          enriched.map(item =>
            item.type === "divider" ? (
              <DateDivider key={item.key} label={item.label} />
            ) : (
              <Bubble
                key={item.msg.id}
                msg={item.msg}
                userId={user.id}
                isFirst={item.isFirst}
                isLast={item.isLast}
              />
            )
          )
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
            ref={textareaRef}
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
            onMouseDown={e => { if (input.trim() && connected) e.currentTarget.style.transform = "scale(0.93)"; }}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
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