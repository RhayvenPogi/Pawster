import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";
const POLL_MS = 60_000;

export default function NotificationBell({ token }) {
  const [unread, setUnread]   = useState(0);
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef               = useRef(null);
  const navigate              = useNavigate();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Poll unread count every 60s ───────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${DJANGO}/api/notifications/unread-count/`, { headers });
      const data = await res.json();
      if (data.success) setUnread(data.unread_count);
    } catch { /* silent fail */ }
  }, [token]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  // ── Load full list when dropdown opens ───────────────────────────────────
  const fetchList = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${DJANGO}/api/notifications/`, { headers });
      const data = await res.json();
      if (data.success) {
        setNotifs(data.data);
        setUnread(data.unread_count);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const toggleOpen = () => {
    if (!open) fetchList();
    setOpen(o => !o);
  };

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mark one read + navigate if survey notif ──────────────────────────────
  const markRead = async (id, notifType) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
    await fetch(`${DJANGO}/api/notifications/${id}/read/`, { method: "POST", headers });

    if (notifType === "survey_scheduled" || notifType === "survey_due") {
      setOpen(false);
      navigate("/follow-up-surveys"); // 👈 adjust to match your route path
    }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    setNotifs(ns => ns.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    await fetch(`${DJANGO}/api/notifications/read-all/`, { method: "POST", headers });
  };

  // ── Icon per notif type ───────────────────────────────────────────────────
  const typeIcon = {
    adoption_approved: { icon: "fa-check-circle",   color: "#1c7a09" },
    adoption_rejected: { icon: "fa-times-circle",   color: "#c03030" },
    rehoming_approved: { icon: "fa-home",           color: "#1a5fbf" },
    rehoming_rejected: { icon: "fa-times-circle",   color: "#c03030" },
    survey_scheduled:  { icon: "fa-clipboard-list", color: "#b4903a" },
    survey_due:        { icon: "fa-bell",           color: "#e07820" },
    general:           { icon: "fa-info-circle",    color: "#6a7a50" },
  };

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={dropRef} style={{ position: "relative", display: "inline-flex" }}>

      {/* Bell button */}
      <button
        onClick={toggleOpen}
        style={{
          position: "relative", width: 38, height: 38, borderRadius: 10,
          border: "1px solid rgba(180,140,60,0.28)",
          background: open ? "rgba(28,79,9,0.10)" : "rgba(255,250,232,0.7)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#3a5020", transition: "all 0.2s",
        }}
      >
        <i className="fas fa-bell" style={{ fontSize: "0.9rem" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 16, height: 16,
            borderRadius: 50, background: "#c03030", color: "#fff",
            fontSize: "0.6rem", fontWeight: 900, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "0 3px",
            fontFamily: "'Nunito',sans-serif",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340,
          borderRadius: 16, border: "1px solid rgba(180,140,60,0.28)",
          background: "rgba(255,252,235,0.99)",
          boxShadow: "0 12px 40px rgba(40,20,5,0.22)",
          zIndex: 1000, overflow: "hidden", animation: "notifFadeIn .18s ease both",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1rem", borderBottom: "1px solid rgba(180,140,60,0.18)",
            background: "linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))",
          }}>
            <div style={{
              fontFamily: "'Playfair Display',serif", fontWeight: 900,
              fontSize: "0.95rem", color: "#1a4a08",
            }}>
              Notifications{" "}
              {unread > 0 && (
                <span style={{
                  fontSize: "0.7rem", background: "#1c4f09", color: "#fff",
                  borderRadius: 50, padding: "1px 6px", marginLeft: 6,
                }}>
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "0.72rem", fontWeight: 800, color: "#5aaa30",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'Nunito',sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6a7a50" }}>
                <i className="fas fa-spinner" style={{ animation: "spin .8s linear infinite" }} />
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <i className="fas fa-bell-slash" style={{
                  fontSize: "2rem", color: "#b4903a", opacity: 0.35,
                  display: "block", marginBottom: "0.5rem",
                }} />
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6a7a50", margin: 0 }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifs.map(n => {
                const ti = typeIcon[n.notif_type] || typeIcon.general;
                const isSurvey = n.notif_type === "survey_scheduled" || n.notif_type === "survey_due";

                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id, n.notif_type)}
                    style={{
                      display: "flex", gap: "0.75rem", padding: "0.875rem 1rem",
                      borderBottom: "1px solid rgba(180,140,60,0.12)",
                      background: n.is_read ? "transparent" : "rgba(28,79,9,0.04)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: `${ti.color}18`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`fas ${ti.icon}`} style={{ color: ti.color, fontSize: "0.8rem" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: n.is_read ? 700 : 900, fontSize: "0.82rem",
                        color: "#1a4a08", lineHeight: 1.35,
                      }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: "0.76rem", fontWeight: 700, color: "#6a7a50",
                        lineHeight: 1.5, marginTop: "0.2rem",
                      }}>
                        {n.body}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "0.67rem", fontWeight: 700, color: "#b4903a" }}>
                          {timeAgo(n.created_at)}
                        </span>
                        {isSurvey && (
                          <span style={{
                            fontSize: "0.62rem", fontWeight: 900, color: "#1c4f09",
                            background: "rgba(28,79,9,0.10)", borderRadius: 50,
                            padding: "1px 6px", letterSpacing: "0.04em",
                          }}>
                            Tap to fill survey →
                          </span>
                        )}
                      </div>
                    </div>

                    {!n.is_read && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#5aaa30", flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}