// pages/admin/AdminMessagingPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useMessaging } from "../../hooks/useMessaging";
import {
  AttachmentToolbar,
  AttachmentPreview,
  UploadingIndicator,
  Lightbox,
} from "../MessageShared";

const PH_LOCALE = "en-PH";
const PH_TZ     = "Asia/Manila";

const MAX_IMAGE_BYTES = 5  * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function userPhotoSrc(userId, fallback) {
  if (!userId) return fallback ?? null;
  return `/api/users/${userId}/photo/public`;
}

function timeAgo(dt) {
  if (!dt) return "";
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dt).toLocaleDateString(PH_LOCALE, { month:"short", day:"numeric", timeZone:PH_TZ });
}

function formatTime(dt) {
  if (!dt) return "";
  const d   = new Date(dt);
  const now = new Date();
  const sameDay =
    d.toLocaleDateString(PH_LOCALE, { timeZone:PH_TZ }) ===
    now.toLocaleDateString(PH_LOCALE, { timeZone:PH_TZ });
  if (sameDay) return d.toLocaleTimeString(PH_LOCALE, { hour:"2-digit", minute:"2-digit", timeZone:PH_TZ });
  return d.toLocaleDateString(PH_LOCALE, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", timeZone:PH_TZ });
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    new Date(a).toLocaleDateString(PH_LOCALE, { timeZone:PH_TZ }) ===
    new Date(b).toLocaleDateString(PH_LOCALE, { timeZone:PH_TZ })
  );
}

function formatDivider(dt) {
  if (!dt) return "";
  const d   = new Date(dt);
  const now = new Date();
  const diff = (now - d) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString(PH_LOCALE, { weekday:"long", month:"short", day:"numeric", timeZone:PH_TZ });
}

function bubbleRadius(isAdmin, isFirst, isLast) {
  if (isAdmin) {
    return `16px ${isFirst ? "4px" : "16px"} ${isLast ? "4px" : "16px"} 16px`;
  } else {
    return `${isFirst ? "4px" : "16px"} 16px 16px ${isLast ? "4px" : "16px"}`;
  }
}

function Avatar({ name, photoUrl, size = 36, style = {} }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  useEffect(() => { setImgFailed(false); }, [photoUrl]);
  const safePhotoUrl = photoUrl && photoUrl.trim() !== "" ? photoUrl : null;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#1c4f09,#3a8a18)", display:"flex", alignItems:"center", justifyContent:"center", color:"#e8f5d4", fontWeight:800, fontSize:size*0.36, flexShrink:0, overflow:"hidden", position:"relative", ...style }}>
      <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", userSelect:"none" }}>{initials}</span>
      {safePhotoUrl && !imgFailed && (
        <img src={safePhotoUrl} alt={initials} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block", zIndex:1 }} onError={() => setImgFailed(true)} />
      )}
    </div>
  );
}

function StatusDot({ online }) {
  return <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background: online ? "#4ade80" : "#94a3b8", flexShrink:0 }} />;
}

function ReadTicks({ read }) {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" style={{ flexShrink:0 }}>
      <path d="M1 4l3 3L10 1" stroke={read ? "#4ade80" : "rgba(212,240,176,0.45)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4l3 3 6-6" stroke={read ? "#4ade80" : "rgba(212,240,176,0.45)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendingSpinner() {
  return (
    <>
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ animation:"_spin 0.8s linear infinite", flexShrink:0 }}>
        <circle cx="5" cy="5" r="4" fill="none" stroke="#8a9e70" strokeWidth="1.5" strokeDasharray="18" strokeDashoffset="6" strokeLinecap="round" />
      </svg>
    </>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 10px", userSelect:"none" }}>
      <div style={{ flex:1, height:1, background:"rgba(170,135,55,0.15)" }} />
      <span style={{ fontSize:10, fontWeight:700, color:"#a8b898", letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(170,135,55,0.15)" }} />
    </div>
  );
}

function Bubble({ msg, isFirst, isLast, adminPhotoUrl, userPhotoUrl, onImageClick }) {
  const isAdmin = msg.senderRole === "admin";
  const avatarName     = isAdmin ? "Pawster Support" : (msg.senderName ?? "");
  const avatarPhotoUrl = isAdmin ? (adminPhotoUrl ?? null) : (userPhotoUrl ?? msg.senderPhotoUrl ?? null);
  const avatarStyle    = {
    background: isAdmin
      ? "linear-gradient(135deg,#1c4f09,#3a8a18)"
      : "linear-gradient(135deg,#7c3300,#c2581e)",
  };

  const hasAttachment = !!msg.attachmentUrl;
  const isImageOnly   = hasAttachment && msg.attachmentType === "image" && !msg.content;

  return (
    <div style={{ display:"flex", flexDirection: isAdmin ? "row-reverse" : "row", alignItems:"flex-end", gap:8, marginBottom: isLast ? 10 : 3 }}>
      {isLast ? (
        <Avatar name={avatarName} photoUrl={avatarPhotoUrl} size={26} style={avatarStyle} />
      ) : (
        <div style={{ width:26, flexShrink:0 }} />
      )}

      <div style={{ display:"flex", flexDirection:"column", alignItems: isAdmin ? "flex-end" : "flex-start", maxWidth:"68%", gap:2 }}>
        {!isAdmin && isFirst && (
          <span style={{ fontSize:10, fontWeight:700, color:"#c2581e", letterSpacing:"0.04em", textTransform:"uppercase", paddingInline:2 }}>
            {msg.senderName}
          </span>
        )}

        {isImageOnly ? (
          <div onClick={() => onImageClick?.(msg.attachmentUrl)} style={{ cursor:"pointer" }}>
            <AttachmentPreview msg={msg} isMine={isAdmin} />
          </div>
        ) : (
          <div style={{
            padding: hasAttachment ? "8px 10px" : "9px 13px",
            borderRadius: bubbleRadius(isAdmin, isFirst, isLast),
            fontSize:13.5, fontWeight:500, lineHeight:1.55,
            background: isAdmin ? "#1e5c0a" : "rgba(255,251,235,0.98)",
            color: isAdmin ? "#d8f2b0" : "#1a2e0a",
            border: isAdmin ? "none" : "1px solid rgba(170,130,50,0.2)",
            wordBreak:"break-word",
            opacity: msg.pending ? 0.55 : 1,
            transition:"opacity 0.25s ease",
            boxShadow: isAdmin ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {hasAttachment && (
              <div onClick={msg.attachmentType === "image" ? () => onImageClick?.(msg.attachmentUrl) : undefined}
                style={{ cursor: msg.attachmentType === "image" ? "pointer" : "default" }}>
                <AttachmentPreview msg={msg} isMine={isAdmin} />
              </div>
            )}
            {msg.content && <span>{msg.content}</span>}
          </div>
        )}

        {isLast && (
          <div style={{ display:"flex", alignItems:"center", gap:4, paddingInline:3, marginTop:1, justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
            {msg.pending ? (
              <><SendingSpinner /><span style={{ fontSize:10, fontWeight:600, color:"#8a9e70" }}>sending…</span></>
            ) : (
              <>
                <span style={{ fontSize:10, fontWeight:600, color:"#8a9e70" }}>{formatTime(msg.createdAt)}</span>
                {isAdmin && <ReadTicks read={msg.read ?? false} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:10, padding:"0 24px", textAlign:"center", userSelect:"none" }}>
      <div style={{ opacity:0.45, color:"#5a7840" }}>{icon}</div>
      <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#5a7840" }}>{title}</p>
      {subtitle && <p style={{ margin:0, fontSize:12, fontWeight:500, color:"#8a9e70", maxWidth:220 }}>{subtitle}</p>}
    </div>
  );
}

function IconInbox() {
  return <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}

function IconChat() {
  return <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function IconSelectChat() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(58,138,24,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(180,44,22,0.94)", color:"#fff", borderRadius:10,
      padding:"9px 18px", fontSize:12.5, fontWeight:700, zIndex:9999,
      boxShadow:"0 4px 20px rgba(0,0,0,0.22)", pointerEvents:"none",
      fontFamily:"'Nunito', sans-serif",
    }}>
      {message}
    </div>
  );
}

export default function AdminMessagingPanel({ user, onUnreadChange }) {
  const [activeUserId,       setActiveUserId]       = useState(null);
  const [activeUserName,     setActiveUserName]      = useState("");
  const [activeUserPhotoUrl, setActiveUserPhotoUrl]  = useState(null);
  const [input,              setInput]               = useState("");
  const [searchQ,            setSearchQ]             = useState("");
  const [uploading,          setUploading]           = useState(false);
  const [uploadFileName,     setUploadFileName]      = useState("");
  const [lightboxSrc,        setLightboxSrc]         = useState(null);
  const [toast,              setToast]               = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const {
    messages, setMessages, connected, unreadCount,
    conversations, loadHistory, sendMessage, uploadFile, markRead, fetchConversations,
  } = useMessaging(user, activeUserId);

  useEffect(() => { onUnreadChange?.(unreadCount); }, [unreadCount, onUnreadChange]);

  const openConversation = useCallback(async (uid, name, photoUrl) => {
    setMessages([]);
    setActiveUserId(uid);
    setActiveUserName(name);
    setActiveUserPhotoUrl(userPhotoSrc(uid, photoUrl));
    setInput("");
    await loadHistory(uid);
    await markRead(uid);
    fetchConversations();
  }, [loadHistory, markRead, fetchConversations, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addOptimistic = (text, attachment = null) => {
    const tempId = `pending-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, content: text || "", senderRole: "admin",
      createdAt: new Date().toISOString(), pending: true, read: false,
      attachmentUrl:      attachment?.url      ?? null,
      attachmentType:     attachment?.type     ?? null,
      attachmentFileName: attachment?.fileName ?? null,
      attachmentFileSize: attachment?.fileSize ?? null,
    }]);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false } : m));
    }, 3000);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text && !pendingAttachment) return;
    if (!activeUserId) return;

    addOptimistic(text, pendingAttachment ? {
      url:      pendingAttachment.url,
      type:     pendingAttachment.type,
      fileName: pendingAttachment.fileName,
      fileSize: pendingAttachment.fileSize,
    } : null);

    sendMessage(text, activeUserId, pendingAttachment ? {
      url:  pendingAttachment.url,
      type: pendingAttachment.type,
    } : undefined);

    setInput("");
    setPendingAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleFilePicked = async (file, kind) => {
    if (!connected || !activeUserId) return;

    const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      const limitMB = (limit / 1048576).toFixed(0);
      setToast(`File too large — max ${limitMB} MB (yours: ${(file.size / 1048576).toFixed(1)} MB)`);
      return;
    }

    setUploading(true);
    setUploadFileName(file.name);
    try {
      const attachment = await uploadFile(file, activeUserId);
      setPendingAttachment({ ...attachment, type: kind, fileName: file.name });
    } catch (err) {
      console.error("[upload] failed", err);
      const status = err?.response?.status;
      if (status === 413) {
        setToast("File too large — the server rejected it. Try a smaller file.");
      } else {
        setToast("Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      setUploadFileName("");
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filtered    = conversations.filter(c => c.userName?.toLowerCase().includes(searchQ.toLowerCase()));
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  if (!user?.id) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:256 }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#8a9e70" }}>Loading…</span>
      </div>
    );
  }

  const enrichedMessages = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !sameDay(prev.createdAt, msg.createdAt)) {
      enrichedMessages.push({ type:"divider", key:`div-${msg.id}`, label:formatDivider(msg.createdAt) });
    }
    const isFirst = !prev || prev.senderRole !== msg.senderRole || !sameDay(prev.createdAt, msg.createdAt);
    const isLast  = !next || next.senderRole !== msg.senderRole || !sameDay(msg.createdAt, next?.createdAt);
    enrichedMessages.push({ type:"bubble", msg, isFirst, isLast });
  });

  return (
    <div style={{ display:"flex", borderRadius:16, overflow:"hidden", height:"calc(100vh - 140px)", minHeight:520, border:"1px solid rgba(90,160,50,0.28)", background:"rgba(252,250,240,0.7)", backdropFilter:"blur(16px)", fontFamily:"'Nunito', sans-serif" }}>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ═══ LEFT SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside style={{ width:272, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid rgba(170,135,55,0.22)", background:"rgba(255,250,228,0.88)" }}>
        <div style={{ padding:"14px 16px 12px", borderBottom:"1px solid rgba(170,135,55,0.18)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"#1a4a08", letterSpacing:"-0.01em" }}>Inbox</div>
            {totalUnread > 0 ? (
              <div style={{ fontSize:11, fontWeight:700, color:"#b44a16", marginTop:1 }}>{totalUnread} unread</div>
            ) : (
              <div style={{ fontSize:11, fontWeight:600, color:"#8a9e70", marginTop:1 }}>All caught up</div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 9px", borderRadius:20, background: connected ? "rgba(74,222,128,0.1)" : "rgba(148,163,184,0.12)", border:`1px solid ${connected ? "rgba(74,222,128,0.28)" : "rgba(148,163,184,0.22)"}` }}>
            <StatusDot online={connected} />
            <span style={{ fontSize:11, fontWeight:700, color: connected ? "#1c4f09" : "#6b7280", letterSpacing:"0.02em" }}>{connected ? "Live" : "Offline"}</span>
          </div>
        </div>

        <div style={{ padding:"10px 12px 8px", borderBottom:"1px solid rgba(170,135,55,0.12)" }}>
          <div style={{ position:"relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a9e70" strokeWidth="2.5" strokeLinecap="round" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" />
            </svg>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search users…"
              style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px 7px 28px", borderRadius:9, border:"1px solid rgba(170,135,55,0.24)", background:"rgba(255,250,230,0.8)", color:"#1a2e0a", fontSize:12, fontWeight:600, fontFamily:"'Nunito', sans-serif", outline:"none" }}
            />
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.length === 0 ? (
            <EmptyState icon={<IconInbox />} title="No conversations yet" subtitle="Users who message you will appear here." />
          ) : (
            filtered.map(conv => {
              const isActive = activeUserId === conv.userId;
              const convPhotoUrl = userPhotoSrc(conv.userId, conv.userPhotoUrl);
              return (
                <button key={conv.userId}
                  onClick={() => openConversation(conv.userId, conv.userName, convPhotoUrl)}
                  style={{ width:"100%", textAlign:"left", padding:"10px 14px", background: isActive ? "rgba(90,160,50,0.12)" : "transparent", borderLeft:`3px solid ${isActive ? "#4a8f20" : "transparent"}`, borderBottom:"1px solid rgba(170,135,55,0.1)", borderTop:"none", borderRight:"none", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background="rgba(90,160,50,0.06)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background="transparent"; }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <Avatar name={conv.userName} photoUrl={convPhotoUrl} size={36} />
                      {conv.unreadCount > 0 && (
                        <span style={{ position:"absolute", top:-3, right:-3, minWidth:16, height:16, borderRadius:8, background:"#c2581e", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", border:"1.5px solid rgba(255,250,228,0.9)" }}>
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                        <span style={{ fontSize:12.5, fontWeight: conv.unreadCount > 0 ? 800 : 700, color:"#1a4a08", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{conv.userName}</span>
                        <span style={{ fontSize:10, fontWeight:600, color:"#8a9e70", flexShrink:0 }}>{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p style={{ margin:"2px 0 0", fontSize:11.5, fontWeight: conv.unreadCount > 0 ? 700 : 500, color: conv.unreadCount > 0 ? "#3a5820" : "#8a9e70", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {conv.lastMessage || "📎 Attachment"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ═══ RIGHT: CHAT WINDOW ═════════════════════════════════════════════════ */}
      <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0 }}>
        {activeUserId ? (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid rgba(170,135,55,0.22)", background:"rgba(255,252,238,0.92)", flexShrink:0 }}>
              <Avatar name={activeUserName} photoUrl={activeUserPhotoUrl} size={38} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#1a4a08", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeUserName}</div>
                <div style={{ fontSize:11, fontWeight:600, color:"#8a9e70", marginTop:1 }}>User #{activeUserId}</div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 8px", display:"flex", flexDirection:"column" }}>
              {enrichedMessages.length === 0 ? (
                <EmptyState icon={<IconChat />} title="No messages yet" subtitle="Send a message to start the conversation." />
              ) : (
                enrichedMessages.map(item =>
                  item.type === "divider" ? (
                    <DateDivider key={item.key} label={item.label} />
                  ) : (
                    <Bubble key={item.msg.id} msg={item.msg} isFirst={item.isFirst} isLast={item.isLast}
                      adminPhotoUrl={userPhotoSrc(user?.id, user?.photoUrl ?? user?.avatarUrl ?? null)}
                      userPhotoUrl={activeUserPhotoUrl}
                      onImageClick={src => setLightboxSrc(src)}
                    />
                  )
                )
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ flexShrink:0, padding:"12px 16px 14px", borderTop:"1px solid rgba(170,135,55,0.22)", background:"rgba(255,252,238,0.92)" }}>
              {pendingAttachment && (
  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", marginBottom:6, borderRadius:10, background:"rgba(90,160,50,0.1)", border:"1px solid rgba(90,160,50,0.25)" }}>
    <span style={{ fontSize:12, fontWeight:700, color:"#3a5820", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
      📎 {pendingAttachment.fileName}
    </span>
    <button onClick={() => setPendingAttachment(null)}
      style={{ fontSize:11, fontWeight:800, color:"#c2581e", background:"none", border:"none", cursor:"pointer", padding:"0 2px" }}>
      ✕
    </button>
  </div>
)}
              <div
                style={{ display:"flex", alignItems:"flex-end", gap:8, borderRadius:14, padding:"8px 8px 8px 10px", background:"rgba(255,253,242,0.95)", border:"1px solid rgba(170,135,55,0.28)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"border-color 0.15s" }}
                onFocusCapture={e=>(e.currentTarget.style.borderColor="rgba(74,143,32,0.5)")}
                onBlurCapture={e=>(e.currentTarget.style.borderColor="rgba(170,135,55,0.28)")}
              >
                <AttachmentToolbar
                  onEmojiSelect={handleEmojiSelect}
                  onFilePicked={handleFilePicked}
                  disabled={!connected || uploading || !activeUserId}
                  size={30}
                  emojiPickerPlacement="above"
                />
                <textarea ref={textareaRef} rows={1} value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
                  onKeyDown={handleKey}
                  placeholder={`Message ${activeUserName}…`}
                  style={{ flex:1, background:"transparent", border:"none", outline:"none", resize:"none", fontSize:13.5, fontWeight:500, lineHeight:1.55, color:"#1a2e0a", minHeight:26, maxHeight:100, fontFamily:"'Nunito', sans-serif", overflowY:"auto" }}
                />
                <button onClick={handleSend} disabled={(!input.trim() && !pendingAttachment) || !connected}
                  style={{ width:34, height:34, borderRadius:10, border:"none", cursor: (input.trim() || pendingAttachment) && connected ? "pointer" : "not-allowed", background: (input.trim() || pendingAttachment) && connected ? "#1e5c0a" : "rgba(170,135,55,0.12)", color: (input.trim() || pendingAttachment) && connected ? "#d4f0b0" : "#8a9e70", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.15s, transform 0.1s" }}
                  onMouseDown={e=>{ if(input.trim()&&connected) e.currentTarget.style.transform="scale(0.93)"; }}
                  onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
              <p style={{ margin:"6px 0 0 4px", fontSize:10.5, fontWeight:600, color:"#8a9e70", userSelect:"none" }}>
                Enter to send · Shift + Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:"0 40px", textAlign:"center", userSelect:"none" }}>
            <div style={{ width:64, height:64, borderRadius:20, background:"rgba(90,160,50,0.1)", border:"1.5px solid rgba(90,160,50,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IconSelectChat />
            </div>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#3a5820" }}>Select a conversation</p>
              <p style={{ margin:"6px 0 0", fontSize:12.5, fontWeight:500, color:"#8a9e70", maxWidth:260, lineHeight:1.5 }}>
                Pick a user from the inbox to view and reply to their messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}