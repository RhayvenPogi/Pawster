// components/MessagingModal.jsx
// Floating chat widget — drop this anywhere above your routes (e.g. in App.jsx)
// and it will render as a fixed bottom-right panel.
//
// Props:
//   user        — from useAuth()
//   isOpen      — boolean, controlled by parent (Navbar)
//   onClose     — () => void
//   onUnreadChange — optional (count) => void

import { useState, useEffect, useRef } from "react";
import { useMessaging } from "../hooks/useMessaging";

const PH_LOCALE = "en-PH";
const PH_TZ     = "Asia/Manila";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function formatTime(dt) {
  if (!dt) return "";
  const d   = new Date(dt);
  const now = new Date();
  const same =
    d.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ }) ===
    now.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ });
  if (same)
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
  return isMine
    ? `16px ${isFirst ? "4px" : "16px"} ${isLast ? "4px" : "16px"} 16px`
    : `${isFirst ? "4px" : "16px"} 16px 16px ${isLast ? "4px" : "16px"}`;
}

/* ─── tiny sub-components ──────────────────────────────────────────────────── */
function AvatarCircle({ name, photoUrl, size = 28, bg, color }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  useEffect(() => { setImgFailed(false); }, [photoUrl]);

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg ?? "linear-gradient(135deg,#1c4f09,#3a8a18)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, color: color ?? "#fff",
      flexShrink: 0, overflow: "hidden", position: "relative",
    }}>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>
        {initials}
      </span>
      {photoUrl && !imgFailed && (
        <img src={photoUrl} alt={initials}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}

function SendingSpinner() {
  return (
    <>
      <style>{`@keyframes _msgspin2{to{transform:rotate(360deg)}}`}</style>
      <svg width="10" height="10" viewBox="0 0 10 10"
        style={{ animation: "_msgspin2 0.8s linear infinite", flexShrink: 0 }}>
        <circle cx="5" cy="5" r="4" fill="none" stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5" strokeDasharray="18" strokeDashoffset="6" strokeLinecap="round" />
      </svg>
    </>
  );
}

function ReadTicks({ read }) {
  const c = read ? "#4ade80" : "rgba(255,255,255,0.35)";
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 4l3 3L10 1" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4l3 3 6-6" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px", userSelect: "none" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(180,140,60,0.2)" }} />
      <span style={{ fontSize: 9, fontWeight: 700, color: "#b0a07a", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(180,140,60,0.2)" }} />
    </div>
  );
}

function Bubble({ msg, userId, user, isFirst, isLast }) {
  const isMine =
    (msg.senderId != null && String(msg.senderId) === String(userId)) ||
    (msg.senderId == null && msg.senderRole !== "admin");

  const avatarName  = isMine
    ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || ""
    : "Pawster Support";
  const avatarPhoto = isMine ? (user?.photoUrl ?? user?.avatarUrl ?? null) : null;
  const avatarBg    = "linear-gradient(135deg,#1c4f09,#3a8a18)";

  return (
    <div style={{
      display: "flex", flexDirection: isMine ? "row-reverse" : "row",
      alignItems: "flex-end", gap: 6,
      marginBottom: isLast ? 8 : 2,
    }}>
      {isLast
        ? <AvatarCircle name={avatarName} photoUrl={avatarPhoto} size={24} bg={avatarBg} color="#fff" />
        : <div style={{ width: 24, flexShrink: 0 }} />
      }

      <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 2, alignItems: isMine ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "8px 12px",
          borderRadius: bubbleRadius(isMine, isFirst, isLast),
          fontSize: 13, fontWeight: 600, lineHeight: 1.5,
          background: isMine
            ? "linear-gradient(135deg,rgba(28,79,9,0.92),rgba(58,138,24,0.88))"
            : "rgba(255,250,232,0.97)",
          color: isMine ? "#fff" : "#1a2e0a",
          border: isMine ? "none" : "1.5px solid rgba(180,140,60,0.28)",
          wordBreak: "break-word",
          opacity: msg.pending ? 0.55 : 1,
          transition: "opacity 0.25s",
          boxShadow: isMine
            ? "inset 0 1px 0 rgba(255,255,255,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {msg.content}
        </div>

        {isLast && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingInline: 2, justifyContent: isMine ? "flex-end" : "flex-start" }}>
            {msg.pending ? (
              <>
                <SendingSpinner />
                <span style={{ fontSize: 9, fontWeight: 600, color: "#9aaa80" }}>sending…</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#9aaa80" }}>{formatTime(msg.createdAt)}</span>
                {isMine && <ReadTicks read={msg.read ?? false} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────────────── */
export default function MessagingModal({ user, isOpen, onClose, onUnreadChange }) {
  const [input, setInput] = useState("");
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const { messages, setMessages, connected, unreadCount, loadHistory, sendMessage, markRead } =
    useMessaging(user);

  // report unread count upward (for Navbar badge)
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // load history + mark read when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadHistory();
      markRead();
    }
  }, [isOpen, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected) return;
    const tempId = `pending-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, content: text, senderId: user.id,
      senderRole: "user", createdAt: new Date().toISOString(), pending: true, read: false,
    }]);
    sendMessage(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false } : m));
    }, 3000);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // build enriched list with date dividers
  const enriched = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const senderKey = msg.senderRole === "admin" ? "admin" : String(msg.senderId ?? "user");
    const prevKey   = prev ? (prev.senderRole === "admin" ? "admin" : String(prev.senderId ?? "user")) : null;
    const nextKey   = next ? (next.senderRole === "admin" ? "admin" : String(next.senderId ?? "user")) : null;
    if (!prev || !sameDayCheck(prev.createdAt, msg.createdAt))
      enriched.push({ type: "divider", key: `div-${msg.id}`, label: formatDivider(msg.createdAt) });
    const isFirst = !prev || prevKey !== senderKey || !sameDayCheck(prev.createdAt, msg.createdAt);
    const isLast  = !next || nextKey !== senderKey || !sameDayCheck(msg.createdAt, next?.createdAt);
    enriched.push({ type: "bubble", msg, isFirst, isLast });
  });

  if (!user) return null;

  return (
    <>
      {/* keyframe animations injected once */}
      <style>{`
        @keyframes _modal_slide_up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes _modal_slide_down {
          from { opacity: 1; transform: translateY(0)    scale(1);    }
          to   { opacity: 0; transform: translateY(24px) scale(0.97); }
        }
        ._msg_scroll::-webkit-scrollbar { width: 4px; }
        ._msg_scroll::-webkit-scrollbar-track { background: transparent; }
        ._msg_scroll::-webkit-scrollbar-thumb { background: rgba(180,140,60,0.25); border-radius: 4px; }
      `}</style>

      {/* Backdrop — subtle, doesn't block the whole page */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "transparent",
            pointerEvents: "all",
          }}
        />
      )}

      {/* Floating panel */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 360,
          maxHeight: isOpen ? 560 : 0,
          height: isOpen ? 560 : 0,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: isOpen
            ? "0 24px 64px rgba(20,50,10,0.22), 0 4px 16px rgba(20,50,10,0.12), 0 0 0 1px rgba(90,160,50,0.22)"
            : "none",
          background: "#f5f0dc",
          fontFamily: "'Nunito', sans-serif",
          display: "flex",
          flexDirection: "column",
          animation: isOpen ? "_modal_slide_up 0.22s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
          pointerEvents: isOpen ? "all" : "none",
          opacity: isOpen ? 1 : 0,
          transition: "box-shadow 0.2s",
        }}
        // prevent backdrop click from firing when clicking inside panel
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px 11px",
          background: "rgba(255,250,220,0.97)",
          borderBottom: "1.5px solid rgba(90,170,48,0.28)",
          flexShrink: 0,
        }}>
          <AvatarCircle
            name="Pawster Support"
            photoUrl={null}
            size={36}
            bg="linear-gradient(135deg,#1c4f09,#3a8a18)"
            color="#fff"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13.5, color: "#1a4a08", letterSpacing: "-0.01em" }}>
              Pawster Support
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                background: connected ? "#4ccc20" : "#ccc",
                boxShadow: connected ? "0 0 0 2px rgba(76,204,32,0.2)" : "none",
              }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: connected ? "#3a8a18" : "#9aaa80" }}>
                {connected ? "Online" : "Connecting…"}
              </span>
            </div>
          </div>

          {/* close button */}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: "50%", border: "none",
              background: "rgba(28,79,9,0.07)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#3a5820", transition: "background 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,79,9,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(28,79,9,0.07)")}
            title="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          className="_msg_scroll"
          style={{
            flex: 1, overflowY: "auto",
            padding: "12px 14px 6px",
            display: "flex", flexDirection: "column",
          }}
        >
          {enriched.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              flex: 1, gap: 8, textAlign: "center", padding: "0 20px",
            }}>
              {/* paw icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(58,138,24,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#6a8a50" }}>No messages yet</p>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#9aaa80", lineHeight: 1.5 }}>
                Send us a message — we're here to help with adoptions, rehoming, and more.
              </p>
            </div>
          ) : (
            enriched.map(item =>
              item.type === "divider"
                ? <DateDivider key={item.key} label={item.label} />
                : <Bubble
                    key={item.msg.id}
                    msg={item.msg}
                    userId={user.id}
                    user={user}
                    isFirst={item.isFirst}
                    isLast={item.isLast}
                  />
            )
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div style={{
          flexShrink: 0,
          padding: "10px 12px 12px",
          background: "rgba(255,250,220,0.97)",
          borderTop: "1.5px solid rgba(180,140,60,0.22)",
        }}>
          <div
            style={{
              display: "flex", alignItems: "flex-end", gap: 8,
              borderRadius: 14, padding: "7px 7px 7px 13px",
              background: "rgba(255,253,240,0.95)",
              border: "1.5px solid rgba(180,140,60,0.32)",
              transition: "border-color 0.15s",
            }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(74,143,32,0.55)")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(180,140,60,0.32)")}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                resize: "none", fontSize: 13, fontWeight: 600, lineHeight: 1.5,
                color: "#1a2e0a", minHeight: 24, maxHeight: 96,
                fontFamily: "'Nunito', sans-serif",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected}
              style={{
                width: 32, height: 32, borderRadius: 10, border: "none",
                cursor: input.trim() && connected ? "pointer" : "not-allowed",
                background: input.trim() && connected
                  ? "linear-gradient(135deg,#1c4f09,#2a7010)"
                  : "rgba(180,140,60,0.15)",
                color: input.trim() && connected ? "#fff" : "#9aaa80",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s, transform 0.1s",
              }}
              onMouseDown={e => { if (input.trim() && connected) e.currentTarget.style.transform = "scale(0.91)"; }}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p style={{ margin: "5px 0 0 3px", fontSize: 9.5, fontWeight: 600, color: "#b0a07a", userSelect: "none" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}