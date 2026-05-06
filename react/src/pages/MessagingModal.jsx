import { useState, useEffect, useRef, useCallback } from "react";
import { useMessaging } from "../hooks/useMessaging";
import { useBotReply, FAQ_OPTIONS, GREETING } from "../hooks/useBotReply";
import {
  AttachmentToolbar,
  AttachmentPreview,
  Lightbox,
} from "./MessageShared";

const PH_LOCALE = "en-PH";
const PH_TZ     = "Asia/Manila";
const MAX_IMAGE_BYTES = 500 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt), now = new Date();
  const same = d.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ }) === now.toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ });
  if (same) return d.toLocaleTimeString(PH_LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: PH_TZ });
  return d.toLocaleDateString(PH_LOCALE, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: PH_TZ });
}

function sameDayCheck(a, b) {
  if (!a || !b) return false;
  return new Date(a).toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ }) === new Date(b).toLocaleDateString(PH_LOCALE, { timeZone: PH_TZ });
}

function formatDivider(dt) {
  if (!dt) return "";
  const d = new Date(dt), now = new Date();
  const diff = (now - d) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString(PH_LOCALE, { weekday: "long", month: "short", day: "numeric", timeZone: PH_TZ });
}

function bubbleRadius(isMine, isFirst, isLast) {
  return isMine
    ? `16px ${isFirst ? "4px" : "16px"} ${isLast ? "4px" : "16px"} 16px`
    : `${isFirst ? "4px" : "16px"} 16px 16px ${isLast ? "4px" : "16px"}`;
}

function FaqIcon({ type }) {
  const s = { width: 15, height: 15, flexShrink: 0 };
  if (type === "adoption") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
  if (type === "payment") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
  if (type === "order") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
    </svg>
  );
  if (type === "health") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
  if (type === "account") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  );
  return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

const FAQ_ICONS = ["adoption", "payment", "order", "health", "account", "general"];

function AvatarCircle({ name, photoUrl, size = 28, bg, color }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  useEffect(() => { setImgFailed(false); }, [photoUrl]);
  const safePhotoUrl = photoUrl && photoUrl.trim() !== "" ? photoUrl : null;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg ?? "linear-gradient(135deg,#1c4f09,#3a8a18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 800, color: color ?? "#fff", flexShrink: 0, overflow: "hidden", position: "relative" }}>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>{initials}</span>
      {safePhotoUrl && !imgFailed && (
        <img src={safePhotoUrl} alt={initials} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} onError={() => setImgFailed(true)} />
      )}
    </div>
  );
}

function SendingSpinner() {
  return (
    <>
      <style>{`@keyframes _msgspin2{to{transform:rotate(360deg)}}`}</style>
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ animation: "_msgspin2 0.8s linear infinite", flexShrink: 0 }}>
        <circle cx="5" cy="5" r="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="18" strokeDashoffset="6" strokeLinecap="round" />
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
      <span style={{ fontSize: 9, fontWeight: 700, color: "#b0a07a", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(180,140,60,0.2)" }} />
    </div>
  );
}

function BotTypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#1c4f09,#3a8a18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff", flexShrink: 0 }}>PS</div>
      <div style={{ padding: "8px 14px", borderRadius: "4px 16px 16px 16px", background: "rgba(255,250,232,0.97)", border: "1.5px solid rgba(180,140,60,0.28)", display: "flex", alignItems: "center", gap: 4 }}>
        <style>{`@keyframes _blink{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
        {[0, 0.2, 0.4].map((d, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a8f20", display: "inline-block", animation: `_blink 1.2s ${d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function FaqBubble({ onSelect, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 10 }}>
      <AvatarCircle name="Pawster Support" size={24} bg="linear-gradient(135deg,#1c4f09,#3a8a18)" color="#fff" />
      <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: "82%" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6a8a50", paddingInline: 2 }}>Choose a topic to get started:</span>
        {FAQ_OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => !disabled && onSelect(opt)}
            disabled={disabled}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              textAlign: "left", padding: "7px 12px",
              borderRadius: 10,
              border: `1.5px solid ${disabled ? "rgba(180,200,160,0.25)" : "rgba(90,160,50,0.45)"}`,
              background: disabled ? "rgba(200,210,190,0.1)" : "rgba(255,250,232,0.97)",
              color: disabled ? "#b0bea0" : "#1a4a08",
              fontSize: 12.5, fontWeight: 700,
              cursor: disabled ? "default" : "pointer",
              fontFamily: "'Nunito', sans-serif",
              transition: "background 0.15s, border-color 0.15s",
              lineHeight: 1.4, opacity: disabled ? 0.55 : 1,
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(90,160,50,0.13)"; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,250,232,0.97)"; }}
          >
            <span style={{ color: disabled ? "#b0bea0" : "#3a8a18", display: "flex" }}>
              <FaqIcon type={FAQ_ICONS[i]} />
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg, userId, user, isFirst, isLast, onImageClick, onFaqSelect, faqDisabled }) {
  const isMine =
    msg.senderRole !== "admin" &&
    !(msg.isBot || msg.bot) &&
    ((msg.senderId != null && String(msg.senderId) === String(userId)) ||
     (msg.senderId == null));

  const avatarName  = isMine
    ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || ""
    : "Pawster Support";
  const avatarPhoto = isMine ? (user?.photoUrl ?? user?.avatarUrl ?? null) : null;
  const avatarBg    = "linear-gradient(135deg,#1c4f09,#3a8a18)";
  const hasAttachment = !!msg.attachmentUrl;
  const isImageOnly   = hasAttachment && msg.attachmentType === "image" && !msg.content;
  const isGreeting    = (msg.isBot || msg.bot) && msg.content === GREETING;

  return (
    <>
      <div style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: 6, marginBottom: isGreeting ? 4 : isLast ? 8 : 2 }}>
        {isLast || isGreeting
          ? <AvatarCircle name={avatarName} photoUrl={avatarPhoto} size={24} bg={avatarBg} color="#fff" />
          : <div style={{ width: 24, flexShrink: 0 }} />
        }
        <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 2, alignItems: isMine ? "flex-end" : "flex-start" }}>
          {isImageOnly ? (
            <div onClick={() => onImageClick?.(msg.attachmentUrl)} style={{ cursor: "pointer" }}>
              <AttachmentPreview msg={msg} isMine={isMine} />
            </div>
          ) : (
            <div style={{
              padding: hasAttachment ? "8px 10px" : "8px 12px",
              borderRadius: bubbleRadius(isMine, isFirst, isLast || isGreeting),
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
              {hasAttachment && (
                <div
                  onClick={msg.attachmentType === "image" ? () => onImageClick?.(msg.attachmentUrl) : undefined}
                  style={{ cursor: msg.attachmentType === "image" ? "pointer" : "default" }}
                >
                  <AttachmentPreview msg={msg} isMine={isMine} />
                </div>
              )}
              {msg.content && <span style={{ whiteSpace: "pre-line" }}>{msg.content}</span>}
            </div>
          )}
          {isLast && !isGreeting && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, paddingInline: 2, justifyContent: isMine ? "flex-end" : "flex-start" }}>
              {msg.pending ? (
                <><SendingSpinner /><span style={{ fontSize: 9, fontWeight: 600, color: "#9aaa80" }}>sending…</span></>
              ) : (
                <><span style={{ fontSize: 9, fontWeight: 600, color: "#9aaa80" }}>{formatTime(msg.createdAt)}</span>{isMine && <ReadTicks read={msg.read ?? false} />}</>
              )}
            </div>
          )}
        </div>
      </div>
      {isGreeting && (
        <div style={{ paddingLeft: 30 }}>
          <FaqBubble onSelect={onFaqSelect} disabled={faqDisabled} />
        </div>
      )}
    </>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(180,44,22,0.94)", color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 11.5, fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.22)", pointerEvents: "none", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
      {message}
    </div>
  );
}

export default function MessagingModal({ user, isOpen, onClose, onUnreadChange }) {
  const [input,             setInput]             = useState("");
  const [uploading,         setUploading]         = useState(false);
  const [uploadFileName,    setUploadFileName]    = useState("");
  const [lightboxSrc,       setLightboxSrc]       = useState(null);
  const [toast,             setToast]             = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [botTyping,         setBotTyping]         = useState(false);
  const [faqSelected,       setFaqSelected]       = useState(false);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const {
    messages, setMessages, connected, unreadCount,
    loadHistory, sendMessage, uploadFile, markRead,
  } = useMessaging(user);

  const { triggerBotGreeting, triggerBotReply } = useBotReply({
    sendMessage,
    messages,
    onBotTypingChange: setBotTyping,
    sessionKey: user?.id ? `user-${user.id}` : null,
    setMessages,
  });

  const handleFaqSelect = useCallback((opt) => {
  if (faqSelected || !connected) return;
  setFaqSelected(true);

  const text = opt.label;
  sendMessage(text, undefined, undefined);

  // use a standalone snapshot — don't depend on stale messages closure
  const faqMessage = { content: text, senderRole: "user", pending: false, senderId: user?.id };

  setTimeout(() => triggerBotReply([faqMessage], { force: true }), 300);
}, [faqSelected, connected, sendMessage, triggerBotReply, user?.id]);

  useEffect(() => { onUnreadChange?.(unreadCount); }, [unreadCount, onUnreadChange]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadHistory().then(history => {
        markRead();
        const alreadySelected = (history ?? []).some(m => m.senderRole === "user");
        if (alreadySelected) setFaqSelected(true);
        triggerBotGreeting(history ?? []);
      });
    }
  }, [isOpen, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, botTyping]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !lightboxSrc) onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, lightboxSrc]);

  const addOptimistic = (text, attachment = null) => {
    const tempId = `pending-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, content: text || "", senderId: user.id,
      senderRole: "user", createdAt: new Date().toISOString(), pending: true, read: false,
      attachmentUrl: attachment?.url ?? null, attachmentType: attachment?.type ?? null,
      attachmentFileName: attachment?.fileName ?? null, attachmentFileSize: attachment?.fileSize ?? null,
    }]);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false } : m));
    }, 3000);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text && !pendingAttachment) return;
    if (!connected) return;
    if (!faqSelected) setFaqSelected(true);

    addOptimistic(text, pendingAttachment ? {
      url: pendingAttachment.url, type: pendingAttachment.type,
      fileName: pendingAttachment.fileName, fileSize: pendingAttachment.fileSize,
    } : null);
    sendMessage(text, undefined, pendingAttachment
      ? { url: pendingAttachment.url, type: pendingAttachment.type }
      : undefined
    );

    const snapshot = [...messages, { content: text, senderRole: "user", pending: false, senderId: user.id }];
    setInput("");
    setPendingAttachment(null);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.focus(); }
    setTimeout(() => triggerBotReply(snapshot), 100);
  };

  const handleFilePicked = async (file, kind) => {
    if (!connected) return;
    const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) { setToast(`File too large — max ${(limit / 1048576).toFixed(0)} MB`); return; }
    setUploading(true); setUploadFileName(file.name);
    try {
      const attachment = await uploadFile(file);
      setPendingAttachment({ ...attachment, type: kind, fileName: file.name });
    } catch (err) {
      setToast(err?.response?.status === 413 ? "File too large — server rejected it." : "Upload failed. Try again.");
    } finally { setUploading(false); setUploadFileName(""); }
  };

  const handleEmojiSelect = (emoji) => { setInput(prev => prev + emoji); textareaRef.current?.focus(); };
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const enriched = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1], next = messages[i + 1];
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
      <style>{`
        @keyframes _modal_slide_up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        ._msg_scroll::-webkit-scrollbar{width:4px}
        ._msg_scroll::-webkit-scrollbar-track{background:transparent}
        ._msg_scroll::-webkit-scrollbar-thumb{background:rgba(180,140,60,0.25);border-radius:4px}
      `}</style>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div
        style={{ position: "fixed", bottom: 24, right: 28, zIndex: 999, width: 360, height: 560, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(20,50,10,0.22), 0 4px 16px rgba(20,50,10,0.12), 0 0 0 1px rgba(90,160,50,0.22)", background: "#f5f0dc", fontFamily: "'Nunito', sans-serif", display: isOpen ? "flex" : "none", flexDirection: "column", pointerEvents: "all" }}
        onClick={e => e.stopPropagation()}
      >
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 11px", background: "rgba(255,250,220,0.97)", borderBottom: "1.5px solid rgba(90,170,48,0.28)", flexShrink: 0 }}>
          <AvatarCircle name="Pawster Support" photoUrl={null} size={36} bg="linear-gradient(135deg,#1c4f09,#3a8a18)" color="#fff" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13.5, color: "#1a4a08" }}>Pawster Support</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", background: connected ? "#4ccc20" : "#ccc" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: connected ? "#3a8a18" : "#9aaa80" }}>{connected ? "Online" : "Connecting…"}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(28,79,9,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a5820" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,79,9,0.14)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(28,79,9,0.07)")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="_msg_scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px 6px", display: "flex", flexDirection: "column" }}>
          {enriched.length === 0 && !botTyping ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, textAlign: "center", padding: "0 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(58,138,24,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#6a8a50" }}>Starting chat…</p>
            </div>
          ) : (
            <>
              {enriched.map(item =>
                item.type === "divider"
                  ? <DateDivider key={item.key} label={item.label} />
                  : (
                    <Bubble
                      key={item.msg.id}
                      msg={item.msg}
                      userId={user.id}
                      user={user}
                      isFirst={item.isFirst}
                      isLast={item.isLast}
                      onImageClick={src => setLightboxSrc(src)}
                      onFaqSelect={handleFaqSelect}
                      faqDisabled={faqSelected}
                    />
                  )
              )}
              {botTyping && <BotTypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: "10px 12px 12px", background: "rgba(255,250,220,0.97)", borderTop: "1.5px solid rgba(180,140,60,0.22)" }}>
          {pendingAttachment && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 6, borderRadius: 10, background: "rgba(90,160,50,0.1)", border: "1px solid rgba(90,160,50,0.25)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3a5820", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle" }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                {pendingAttachment.fileName}
              </span>
              <button onClick={() => setPendingAttachment(null)} style={{ fontSize: 11, fontWeight: 800, color: "#c2581e", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          <div
            style={{ display: "flex", alignItems: "flex-end", gap: 6, borderRadius: 14, padding: "7px 7px 7px 10px", background: "rgba(255,253,240,0.95)", border: "1.5px solid rgba(180,140,60,0.32)", transition: "border-color 0.15s" }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(74,143,32,0.55)")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(180,140,60,0.32)")}
          >
            <AttachmentToolbar onEmojiSelect={handleEmojiSelect} onFilePicked={handleFilePicked} disabled={!connected || uploading} size={28} emojiPickerPlacement="above-left" />
            <textarea
              ref={textareaRef} rows={1} value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"; }}
              onKeyDown={handleKey}
              placeholder={faqSelected ? "Type a message…" : "Select a topic above or type here…"}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: "#1a2e0a", minHeight: 24, maxHeight: 96, fontFamily: "'Nunito', sans-serif" }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingAttachment) || !connected}
              style={{ width: 32, height: 32, borderRadius: 10, border: "none", cursor: (input.trim() || pendingAttachment) && connected ? "pointer" : "not-allowed", background: (input.trim() || pendingAttachment) && connected ? "linear-gradient(135deg,#1c4f09,#2a7010)" : "rgba(180,140,60,0.15)", color: (input.trim() || pendingAttachment) && connected ? "#fff" : "#9aaa80", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s, transform 0.1s" }}
              onMouseDown={e => { if ((input.trim() || pendingAttachment) && connected) e.currentTarget.style.transform = "scale(0.91)"; }}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
          <p style={{ margin: "5px 0 0 3px", fontSize: 9.5, fontWeight: 600, color: "#b0a07a", userSelect: "none" }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}