// components/MessageShared.jsx
// Shared components used by MessagingModal, MessagingPage, and AdminMessagingPanel.
// Import what you need from here.

import { useState, useRef, useEffect, useCallback } from "react";

// ── Emoji list ─────────────────────────────────────────────────────────────
const EMOJI_LIST = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😇","😈","😉","😊",
  "😋","😌","😍","🥰","😘","😗","😙","😚","😛","😜","🤪","😝",
  "🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒",
  "🙄","😬","🤥","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤧",
  "🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟",
  "🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥",
  "😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡",
  "😠","🤬","😈","💀","☠️","💩","🤡","👹","👺","👻","👽","🤖",
  "😺","😸","😹","😻","😼","😽","🙀","😿","😾","👋","🤚","🖐",
  "✋","🖖","👌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
  "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐",
  "🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂",
  "🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁","👅","👄","💋",
  "🩸","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️",
  "💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","🌈","🔥",
  "💥","✨","🎉","🎊","🎈","🎁","🏆","🥇","⭐","🌟","💫","🌺",
  "🌸","🍀","🦋","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️",
  "🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
  "🐦","🦅","🦆","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋",
  "🐌","🐞","🐜","🦟","🦗","🕷","🦂","🐢","🐍","🦎","🦖","🦕",
  "🐙","🦑","🦐","🦞","🦀","🐡","🐟","🐠","🐬","🐳","🐋","🦈",
  "🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫",
  "🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥",
  "🍅","🍆","🥑","🥦","🧅","🥔","🌽","🌶","🫑","🥒","🥬","🧄",
  "🍕","🍔","🍟","🌭","🌮","🌯","🥙","🧆","🥚","🍳","🥘","🍲",
  "🍜","🍝","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥",
  "🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪",
  "☕","🫖","🧃","🥤","🧋","🍵","🍺","🍻","🥂","🍷","🥃","🍹",
  "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏭",
  "💼","📁","📂","📋","📌","📍","🗂","📅","📆","🗒","🗓","📇",
  "📈","📉","📊","📋","📝","✏️","📌","📎","🖇","📏","📐","✂️",
  "🖊","🖋","📖","📚","🔍","🔎","🔒","🔓","🔑","🗝","🔨","⚒",
  "🛠","⛏","🔧","🔩","⚙️","🗜","🔗","⛓","🧲","🔮","💡","🔦",
  "🕯","🪔","💊","💉","🩺","🩻","🩹","🏋","🤸","⛹","🤺","🤼",
  "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚",
  "✈️","🚀","🛸","🚁","⛵","🚢","🚂","🚆","🚇","🚊","🚉","🚍",
  "⌚","📱","💻","⌨️","🖥","🖨","📷","📸","📹","🎥","📺","📻",
  "🎵","🎶","🎸","🎹","🎺","🎻","🥁","🎷","🎼","🎤","🎧","📢",
  "🌍","🌎","🌏","🗺","🧭","🏔","⛰","🌋","🗻","🏕","🏖","🏜",
  "🌅","🌄","🌠","🎇","🎆","🌃","🏙","🌉","🌌","🌁","🌫","🌊",
];

// ── Format file size ───────────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ── Attachment preview inside a bubble ────────────────────────────────────
export function AttachmentPreview({ msg, isMine }) {
  const { attachmentUrl, attachmentType, attachmentFileName, attachmentFileSize } = msg;
  if (!attachmentUrl) return null;

  const baseUrl = attachmentUrl.startsWith("http") ? attachmentUrl : attachmentUrl;

  if (attachmentType === "image") {
    return (
      <a href={baseUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: msg.content ? 6 : 0 }}>
        <img
          src={baseUrl}
          alt="attachment"
          style={{
            maxWidth: 220, maxHeight: 180, borderRadius: 10,
            display: "block", objectFit: "cover",
            border: isMine ? "none" : "1px solid rgba(170,135,55,0.25)",
          }}
        />
      </a>
    );
  }

  if (attachmentType === "video") {
    return (
      <video
        src={baseUrl}
        controls
        style={{
          maxWidth: 220, maxHeight: 160, borderRadius: 10,
          display: "block", marginBottom: msg.content ? 6 : 0,
        }}
      />
    );
  }

  // Generic file
  const name = attachmentFileName || attachmentUrl.split("/").pop();
  const size = attachmentFileSize ? formatBytes(attachmentFileSize) : "";
  return (
    <a
      href={baseUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px",
        borderRadius: 10,
        background: isMine ? "rgba(255,255,255,0.12)" : "rgba(90,160,50,0.08)",
        border: isMine ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(90,160,50,0.2)",
        textDecoration: "none",
        marginBottom: msg.content ? 6 : 0,
        minWidth: 140,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={isMine ? "rgba(255,255,255,0.8)" : "#4a8f20"}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: isMine ? "rgba(255,255,255,0.92)" : "#1a4a08",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150,
        }}>
          {name}
        </div>
        {size && (
          <div style={{ fontSize: 10, fontWeight: 600, color: isMine ? "rgba(255,255,255,0.55)" : "#8a9e70", marginTop: 1 }}>
            {size}
          </div>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={isMine ? "rgba(255,255,255,0.6)" : "#8a9e70"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </a>
  );
}

// ── Emoji Picker ──────────────────────────────────────────────────────────
export function EmojiPicker({ onSelect, onClose, style = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        background: "rgba(255, 252, 238, 0.98)",
        border: "1px solid rgba(170, 135, 55, 0.3)",
        borderRadius: 14,
        padding: "10px",
        boxShadow: "0 8px 32px rgba(20,50,10,0.18), 0 2px 8px rgba(20,50,10,0.1)",
        zIndex: 999,
        width: 288,
        maxHeight: 220,
        overflowY: "auto",
        fontFamily: "'Nunito', sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 2,
        }}
      >
        {EMOJI_LIST.map((emoji, i) => (
          <button
            key={i}
            onClick={() => { onSelect(emoji); onClose(); }}
            style={{
              fontSize: 18, border: "none", background: "transparent",
              cursor: "pointer", borderRadius: 6, padding: "3px",
              lineHeight: 1,
              transition: "background 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(90,160,50,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Upload progress overlay ───────────────────────────────────────────────
export function UploadingIndicator({ fileName }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 12px",
      borderRadius: 10,
      background: "rgba(90,160,50,0.1)",
      border: "1px dashed rgba(90,160,50,0.35)",
      marginBottom: 6,
    }}>
      <style>{`@keyframes _ulspin{to{transform:rotate(360deg)}}`}</style>
      <svg width="14" height="14" viewBox="0 0 10 10"
        style={{ animation: "_ulspin 0.8s linear infinite", flexShrink: 0 }}>
        <circle cx="5" cy="5" r="4" fill="none" stroke="#4a8f20"
          strokeWidth="1.5" strokeDasharray="18" strokeDashoffset="6" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3a5820" }}>
        Uploading {fileName ? `"${fileName}"` : "file"}…
      </span>
    </div>
  );
}

// ── The 3 toolbar icon buttons + emoji picker + file inputs ───────────────
/**
 * Props:
 *   onEmojiSelect(emoji)            — called when user picks an emoji
 *   onFilePicked(file, kind)        — called with File object and "image" | "video" | "file"
 *   disabled                        — bool
 *   size                            — button size in px (default 30)
 *   emojiPickerPlacement            — "above" (default) | "above-left"
 */
export function AttachmentToolbar({
  onEmojiSelect,
  onFilePicked,
  disabled = false,
  size = 30,
  emojiPickerPlacement = "above",
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const imageInputRef = useRef(null);
  const fileInputRef  = useRef(null);

  const iconBtn = (title, onClick, children) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size,
        border: "none", background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, flexShrink: 0,
        color: disabled ? "#c0c8b0" : "#5a7840",
        transition: "background 0.15s, color 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = "rgba(90,160,50,0.1)"; e.currentTarget.style.color = "#3a6020"; } }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = disabled ? "#c0c8b0" : "#5a7840"; }}
    >
      {children}
    </button>
  );

  const pickerStyle = emojiPickerPlacement === "above-left"
    ? { bottom: size + 8, right: 0 }
    : { bottom: size + 8, left: 0 };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1, position: "relative", flexShrink: 0 }}>
      {/* Hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          const kind = f.type.startsWith("video/") ? "video" : "image";
          onFilePicked(f, kind);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          onFilePicked(f, "file");
          e.target.value = "";
        }}
      />

      {/* Emoji picker */}
      {showEmoji && (
        <EmojiPicker
          onSelect={onEmojiSelect}
          onClose={() => setShowEmoji(false)}
          style={pickerStyle}
        />
      )}

      {/* 1 — File button */}
      {iconBtn("Attach file", () => fileInputRef.current?.click(),
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      )}

      {/* 2 — Image/Video button */}
      {iconBtn("Attach image or video", () => imageInputRef.current?.click(),
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      )}

      {/* 3 — Emoji button */}
      {iconBtn("Pick emoji", (e) => { e.stopPropagation(); setShowEmoji(v => !v); },
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      )}
    </div>
  );
}

// ── Image lightbox (click to enlarge) ─────────────────────────────────────
export function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt="full"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "88vh",
          borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          objectFit: "contain",
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 18, right: 18,
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.15)", color: "#fff",
          cursor: "pointer", fontSize: 20, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}