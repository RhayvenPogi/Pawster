// pages/admin/AdminMessagingPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useMessaging } from "../../hooks/useMessaging";

function timeAgo(dt) {
  if (!dt) return "";
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dt).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function Avatar({ name, size = 9 }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-black flex-shrink-0`}
      style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)", fontSize: size > 8 ? 14 : 11 }}
    >
      {initials}
    </div>
  );
}

function Bubble({ msg }) {
  const isMine = msg.senderRole === "admin";
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
        style={{ background: isMine ? "linear-gradient(135deg,#1c4f09,#3a8a18)" : "linear-gradient(135deg,#B45A22,#e07820)" }}
      >
        {isMine ? "Me" : msg.senderName?.[0] || "U"}
      </div>
      <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && (
          <span className="text-[10px] font-extrabold" style={{ color: "#B45A22" }}>{msg.senderName}</span>
        )}
        <div
          className="px-3.5 py-2 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm"
          style={{
            background: isMine
              ? "linear-gradient(135deg,rgba(28,79,9,0.92),rgba(58,138,24,0.88))"
              : "rgba(255,250,232,0.95)",
            color: isMine ? "#fff" : "#1a2e0a",
            borderBottomRightRadius: isMine ? 4 : undefined,
            borderBottomLeftRadius:  !isMine ? 4 : undefined,
            border: isMine ? "none" : "1.5px solid rgba(180,140,60,0.28)",
          }}
        >
          {msg.content}
        </div>
        <span className="text-[10px] font-semibold" style={{ color: "#9aaa80" }}>{time}</span>
      </div>
    </div>
  );
}

export default function AdminMessagingPanel({ user, onUnreadChange }) {
  const [activeUserId,   setActiveUserId]   = useState(null);
  const [activeUserName, setActiveUserName] = useState("");
  const [input,          setInput]          = useState("");
  const [searchQ,        setSearchQ]        = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const {
    messages,
    setMessages,
    connected,
    unreadCount,
    conversations,
    loadHistory,
    sendMessage,
    markRead,
    fetchConversations,
  } = useMessaging(user, activeUserId);

  // Push unread count up to AdminDashboard for the sidebar badge
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const openConversation = useCallback(async (uid, name) => {
    setMessages([]);
    setActiveUserId(uid);
    setActiveUserName(name);
    setInput("");
    await loadHistory(uid);
    await markRead(uid);
    fetchConversations();
  }, [loadHistory, markRead, fetchConversations, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeUserId) return;
    sendMessage(input.trim(), activeUserId);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filtered    = conversations.filter(c => c.userName?.toLowerCase().includes(searchQ.toLowerCase()));
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm font-semibold" style={{ color: "#9aaa80" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div
      className="flex rounded-2xl overflow-hidden"
      style={{
        height: "calc(100vh - 140px)",
        minHeight: 500,
        border: "1.5px solid rgba(90,170,48,0.35)",
        background: "rgba(255,252,235,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ══ LEFT: Conversation list ══════════════════════════════════════════ */}
      <aside
        className="flex flex-col"
        style={{ width: 280, flexShrink: 0, borderRight: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,248,220,0.85)" }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1.5px solid rgba(180,140,60,0.22)" }}>
          <div>
            <div className="font-black text-[#1a4a08] text-sm">Inbox</div>
            {totalUnread > 0 && (
              <div className="text-[11px] font-bold" style={{ color: "#B45A22" }}>{totalUnread} unread</div>
            )}
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-black"
            style={{ background: connected ? "rgba(90,170,48,0.12)" : "rgba(180,140,60,0.12)", color: connected ? "#1c4f09" : "#9aaa80" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? "#4ccc20" : "#ccc" }} />
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(180,140,60,0.15)" }}>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search users…"
            className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
            style={{ background: "rgba(255,248,225,0.7)", border: "1px solid rgba(180,140,60,0.28)", color: "#1a2e0a", fontFamily: "'Nunito', sans-serif" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
              <span className="text-2xl">📭</span>
              <span className="text-xs font-bold" style={{ color: "#9aaa80" }}>No conversations yet</span>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.userId}
                onClick={() => openConversation(conv.userId, conv.userName)}
                className="w-full text-left px-4 py-3 transition-all"
                style={{
                  background: activeUserId === conv.userId ? "rgba(90,170,48,0.14)" : "transparent",
                  borderLeft: activeUserId === conv.userId ? "3px solid #5aaa30" : "3px solid transparent",
                  borderBottom: "1px solid rgba(180,140,60,0.12)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar name={conv.userName} size={9} />
                    {conv.unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                        style={{ background: "#B45A22" }}
                      >
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold truncate" style={{ color: "#1a4a08" }}>{conv.userName}</span>
                      <span className="text-[10px] font-semibold flex-shrink-0 ml-1" style={{ color: "#9aaa80" }}>{timeAgo(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-[11px] font-semibold truncate mt-0.5" style={{ color: conv.unreadCount > 0 ? "#3a5020" : "#9aaa80" }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ══ RIGHT: Chat window ═══════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0">
        {activeUserId ? (
          <>
            <div
              className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
              style={{ borderBottom: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,250,235,0.9)" }}
            >
              <Avatar name={activeUserName} size={10} />
              <div>
                <div className="font-black text-sm" style={{ color: "#1a4a08" }}>{activeUserName}</div>
                <div className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>User ID #{activeUserId}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <span className="text-4xl">💬</span>
                  <p className="text-sm font-bold" style={{ color: "#6a8a50" }}>No messages yet</p>
                  <p className="text-xs font-semibold" style={{ color: "#9aaa80" }}>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map(msg => <Bubble key={msg.id} msg={msg} />)
              )}
              <div ref={bottomRef} />
            </div>

            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ borderTop: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,250,235,0.9)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,252,238,0.9)", border: "1.5px solid rgba(180,140,60,0.30)" }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                  onKeyDown={handleKey}
                  placeholder={`Reply to ${activeUserName}…`}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-semibold leading-relaxed"
                  style={{ color: "#1a2e0a", minHeight: 26, maxHeight: 100, fontFamily: "'Nunito', sans-serif" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !connected}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: input.trim() && connected ? "linear-gradient(135deg,#1c4f09,#2a7010)" : "rgba(180,140,60,0.15)",
                    color: input.trim() && connected ? "#fff" : "#9aaa80",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="rgba(90,170,48,0.18)">
              <ellipse cx="50" cy="66" rx="24" ry="21" />
              <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)" />
              <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)" />
              <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)" />
              <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)" />
            </svg>
            <div>
              <p className="font-black text-base" style={{ color: "#6a8a50" }}>Select a conversation</p>
              <p className="text-sm font-semibold mt-1" style={{ color: "#9aaa80" }}>
                Choose a user from the inbox to view and reply to their messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}