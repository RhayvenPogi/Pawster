/**
 * SurveyPanel.jsx
 * Admin panel — reads from Django /api/surveys/admin/
 * Renamed: "Survey" → "Feedback Report" throughout
 * Added: pet photo gallery in detail modal + photo thumbnails on cards
 * Fixed: defensive photo normalization — handles url, thumbnail_url, image, file_url shapes
 * Updated: fully mobile-responsive; SVG icons replace all emoji
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function djFetch(path) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

function normalizePhoto(p) {
  if (!p) return null;
  if (typeof p === "string") return { url: p };
  const url =
    p.url || p.thumbnail_url || p.image || p.file_url || p.photo || p.src || null;
  if (!url) return null;
  return { url, thumbnail_url: p.thumbnail_url || url };
}

function normalizePhotos(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePhoto).filter(Boolean);
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconCamera = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconExpand = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

const IconChevronLeft = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconChevronRight = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconX = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconEye = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconTriangle = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  </svg>
);

const IconClipboard = ({ size = 40, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconRefresh = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconStar = ({ filled, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? "#e07820" : "none"}
    stroke={filled ? "#e07820" : "rgba(180,140,60,0.35)"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Photo lightbox ─────────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [photos.length, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "1rem",
        padding: "clamp(0.5rem, 3vw, 1rem)",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", maxWidth: 700, width: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
        }}>
        {/* Main image */}
        <div style={{
          position: "relative", width: "100%", borderRadius: 16,
          overflow: "hidden", background: "rgba(255,255,255,0.05)",
        }}>
          <img
            src={photos[idx].url}
            alt={`Pet photo ${idx + 1}`}
            style={{
              width: "100%",
              maxHeight: "clamp(40vh, 55vw, 65vh)",
              objectFit: "contain", display: "block",
            }}
          />
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "0.25rem 0.625rem", borderRadius: 50,
            background: "rgba(0,0,0,0.6)", color: "#fff",
            fontSize: "0.72rem", fontWeight: 800,
          }}>
            {idx + 1} / {photos.length}
          </div>
        </div>

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => Math.max(i - 1, 0))}
              disabled={idx === 0}
              style={{
                position: "absolute",
                left: "clamp(-44px, -5vw, -20px)",
                top: "50%", transform: "translateY(-50%)",
                width: 40, height: 40, borderRadius: "50%",
                background: idx === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                border: "none", color: "#fff",
                cursor: idx === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <IconChevronLeft size={18} />
            </button>
            <button
              onClick={() => setIdx(i => Math.min(i + 1, photos.length - 1))}
              disabled={idx === photos.length - 1}
              style={{
                position: "absolute",
                right: "clamp(-44px, -5vw, -20px)",
                top: "50%", transform: "translateY(-50%)",
                width: 40, height: 40, borderRadius: "50%",
                background: idx === photos.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                border: "none", color: "#fff",
                cursor: idx === photos.length - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <IconChevronRight size={18} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: "clamp(40px,10vw,52px)",
                  height: "clamp(40px,10vw,52px)",
                  borderRadius: 8, overflow: "hidden",
                  border: `2px solid ${i === idx ? "#5aaa30" : "rgba(255,255,255,0.2)"}`,
                  background: "none", cursor: "pointer", padding: 0,
                  transition: "border-color 0.15s",
                }}>
                <img
                  src={p.thumbnail_url || p.url}
                  alt={`thumb-${i}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 16, right: 16,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", border: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <IconX size={18} />
      </button>
    </div>
  );
}

// ── Photo gallery strip ────────────────────────────────────────────────────────
function PhotoGallery({ photos }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{
          fontSize: "0.67rem", fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.07em",
          color: "#5a7a40", display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          <IconCamera size={13} />
          Pet Photos ({photos.length})
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(photos.length, 5)}, 1fr)`,
          gap: "0.4rem",
        }}>
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIdx(i)}
              style={{
                position: "relative", aspectRatio: "1",
                borderRadius: 10, overflow: "hidden",
                border: "1px solid rgba(90,170,48,0.3)",
                background: "rgba(28,79,9,0.05)",
                cursor: "pointer", padding: 0, display: "block",
              }}>
              <img
                src={p.thumbnail_url || p.url}
                alt={`Pet photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0)", transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.28)";
                  e.currentTarget.querySelector("svg").style.opacity = "1";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(0,0,0,0)";
                  e.currentTarget.querySelector("svg").style.opacity = "0";
                }}>
                <IconExpand size={16} style={{ color: "#fff", opacity: 0, transition: "opacity 0.15s" }} />
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80", margin: 0 }}>
          Click a photo to view full size
        </p>
      </div>

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function ReportDetailModal({ s, open, onClose }) {
  if (!open || !s) return null;
  const name     = s.adopter_name || "Adopter";
  const rating   = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;
  const photos   = normalizePhotos(s.photos);
  const reportTypeLabel =
  s.survey_type === "7_day"  ? "7-Day Feedback Report"  :
  s.survey_type === "30_day" ? "30-Day Feedback Report" :
                               "90-Day Feedback Report";

  const fields = [
    ["Adopter",         s.adopter_name],
    ["Animal",          s.animal_name],
    ["Report Type",     reportTypeLabel],
    ["Submitted",       s.submitted_at
      ? new Date(s.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "—"],
    ["Adjustment",      s.adjustment],
    ["Showing Illness", s.showing_illness ? "YES" : "No"],
    ["Vet Visited",     s.vet_visited    ? "Yes" : "No"],
    ["Satisfied",       s.satisfied      ? "Yes" : "No"],
    ["Needs Support",   s.needs_support  ? "Yes" : "No"],
    ["Rating",          `${rating}/5 stars`],
  ];

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "clamp(1rem, 4vw, 2rem) clamp(0.5rem, 3vw, 1rem)",
        overflowY: "auto",
        background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 560, borderRadius: 20,
        background: "#fffce8",
        border: `1px solid ${isHealth ? "rgba(192,48,48,0.4)" : "rgba(180,140,60,0.28)"}`,
        boxShadow: "0 24px 64px rgba(40,20,5,0.45)",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "0.875rem 1.125rem",
          borderBottom: "1px solid rgba(180,140,60,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: isHealth
            ? "rgba(192,48,48,0.05)"
            : "linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))",
          flexShrink: 0, gap: "0.75rem",
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif", fontWeight: 900,
              fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
              color: isHealth ? "#c03030" : "#1a4a08",
              display: "flex", alignItems: "center", gap: "0.35rem",
              flexWrap: "wrap",
            }}>
              {isHealth && <IconTriangle size={14} style={{ color: "#c03030", flexShrink: 0 }} />}
              {isHealth ? "Health Flag — " : ""}Feedback Report Details
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>
              {name} · {reportTypeLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              border: "1px solid rgba(192,48,48,0.2)",
              background: "rgba(192,48,48,0.08)", color: "#c03030",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <IconX size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          overflowY: "auto", padding: "1rem 1.125rem",
          flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem",
        }}>

          {/* Star rating */}
          <div style={{
            display: "flex", gap: "0.2rem", alignItems: "center",
            padding: "0.625rem 0.875rem", borderRadius: 12,
            background: "rgba(224,120,32,0.06)", border: "1px solid rgba(224,120,32,0.2)",
            flexWrap: "wrap",
          }}>
            {[1,2,3,4,5].map(k => <IconStar key={k} filled={k <= rating} size={22} />)}
            <span style={{
              marginLeft: "0.5rem", fontWeight: 800,
              fontSize: "0.85rem", color: "#b05010", alignSelf: "center",
            }}>
              {rating}/5
            </span>
          </div>

          {/* Fields grid — 1 col on mobile, 2 on wider */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
            gap: "0.5rem",
          }}>
            {fields.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([label, value]) => (
              <div key={label} style={{
                padding: "0.5rem 0.75rem", borderRadius: 10,
                background: "rgba(255,248,218,0.6)", border: "1px solid rgba(180,140,60,0.18)",
              }}>
                <div style={{
                  fontSize: "0.62rem", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  color: "#9aaa80", marginBottom: 2,
                }}>{label}</div>
                <div style={{
                  fontSize: "0.83rem", fontWeight: 700,
                  color: String(value) === "YES" ? "#c03030" : "#1a2e0a",
                }}>
                  {String(value) === "YES"
                    ? <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <IconTriangle size={12} style={{ color: "#c03030" }} /> YES
                      </span>
                    : String(value)
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Pet Photos */}
          {photos.length > 0 ? (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 12,
              background: "rgba(28,79,9,0.04)", border: "1px solid rgba(90,170,48,0.2)",
            }}>
              <PhotoGallery photos={photos} />
            </div>
          ) : (
            <div style={{
              padding: "0.625rem 0.875rem", borderRadius: 10,
              background: "rgba(180,140,60,0.06)",
              border: "1px dashed rgba(180,140,60,0.28)", textAlign: "center",
            }}>
              <IconCamera size={22} style={{ color: "#b4903a", opacity: 0.4, display: "block", margin: "0 auto 0.25rem" }} />
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9aaa80" }}>
                No pet photos submitted with this report
              </div>
            </div>
          )}

          {/* Notes */}
          {(s.behavioral_notes || s.additional_notes) && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 12,
              background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.2)",
            }}>
              <div style={{
                fontSize: "0.67rem", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.07em",
                color: "#5a7a40", marginBottom: "0.4rem",
              }}>Notes</div>
              {s.behavioral_notes && (
                <p style={{ fontSize: "0.83rem", fontWeight: 700, color: "#3a5020", margin: "0 0 0.4rem" }}>
                  <strong>Behavioral:</strong> {s.behavioral_notes}
                </p>
              )}
              {s.additional_notes && (
                <p style={{ fontSize: "0.83rem", fontWeight: 700, color: "#3a5020", margin: 0 }}>
                  <strong>Additional:</strong> {s.additional_notes}
                </p>
              )}
            </div>
          )}

          {/* Health alert */}
          {isHealth && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 12,
              background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.25)",
              fontSize: "0.82rem", fontWeight: 700, color: "#c03030",
              display: "flex", alignItems: "flex-start", gap: "0.4rem",
            }}>
              <IconTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              This adopter has reported health concerns. Consider reaching out to follow up directly.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Report card ────────────────────────────────────────────────────────────────
function ReportCard({ s, onView }) {
  const name     = s.adopter_name || "Adopter";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const rating   = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;
  const photos   = normalizePhotos(s.photos);

  return (
    <div style={{
      background: "#fffce8",
      borderColor: isHealth ? "rgba(192,48,48,0.4)" : "#ddd0a8",
      borderWidth: 1, borderStyle: "solid",
      borderRadius: 16, overflow: "hidden",
      display: "flex", flexDirection: "column",
      boxShadow: "0 1px 4px rgba(40,20,5,0.07)",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(40,20,5,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,20,5,0.07)";
      }}>
      {/* Top accent bar */}
      <div style={{
        height: 4, width: "100%",
        background: isHealth ? "#ef4444" : "#3b82f6",
        flexShrink: 0,
      }} />

      {/* Photo strip */}
      {photos.length > 0 && (
        <div style={{
          position: "relative",
          height: "clamp(60px, 15vw, 80px)",
          background: "rgba(28,79,9,0.04)",
          borderBottom: "1px solid rgba(180,140,60,0.15)",
          overflow: "hidden", display: "flex", flexShrink: 0,
        }}>
          {photos.slice(0, 4).map((p, i) => (
            <div key={i} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <img
                src={p.thumbnail_url || p.url}
                alt={`pet-${i}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          ))}
          {photos.length > 4 && (
            <div style={{
              position: "absolute", bottom: 6, right: 6,
              padding: "0.15rem 0.45rem", borderRadius: 50,
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: "0.62rem", fontWeight: 800,
            }}>
              +{photos.length - 4} more
            </div>
          )}
          <div style={{
            position: "absolute", top: 6, left: 6,
            padding: "0.15rem 0.45rem", borderRadius: 50,
            background: "rgba(28,79,9,0.75)", color: "#fff",
            fontSize: "0.6rem", fontWeight: 800,
            display: "flex", alignItems: "center", gap: "0.2rem",
          }}>
            <IconCamera size={10} /> {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      <div style={{
        padding: "clamp(0.75rem, 3vw, 1rem)",
        display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1,
      }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: "0.85rem", flexShrink: 0,
            background: isHealth ? "#c03030" : "#1a8a6a",
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 900, fontSize: "0.875rem",
              color: "#1a4a08", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>{name}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, marginTop: 2, color: "#9aaa80" }}>
              {s.submitted_at
                ? new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </div>
          </div>
          {/* Badges — stack vertically on small screens */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: "0.67rem", fontWeight: 900,
              padding: "0.2rem 0.55rem", borderRadius: 50,
              background: "rgba(59,130,246,0.12)", color: "#2563eb",
            }}>
              {s.survey_type === "7_day"  ? "7-Day"  :
              s.survey_type === "30_day" ? "30-Day" : "90-Day"}
            </span>
            {isHealth && (
              <span style={{
                fontSize: "0.62rem", fontWeight: 900,
                padding: "0.15rem 0.45rem", borderRadius: 50,
                background: "rgba(239,68,68,0.12)", color: "#dc2626",
                display: "flex", alignItems: "center", gap: "0.2rem",
              }}>
                <IconTriangle size={10} /> Health flag
              </span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(180,140,60,0.15)" }} />

        {/* Info grid — auto responsive columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.5rem",
        }}>
          {[
            ["Animal",        s.animal_name   || "—"],
            ["Adjustment",    s.adjustment    || "—"],
            ["Vet visited",   s.vet_visited   ? "Yes" : "No"],
            ["Needs support", s.needs_support ? "Yes" : "No"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{
                fontSize: "0.6rem", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.07em",
                marginBottom: 2, color: "#9aaa80",
              }}>{lbl}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Stars */}
        <div>
          <div style={{
            fontSize: "0.6rem", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.07em",
            marginBottom: 4, color: "#9aaa80",
          }}>Rating</div>
          <div style={{ display: "flex", gap: 2 }}>
            {[1,2,3,4,5].map(k => <IconStar key={k} filled={k <= rating} size={16} />)}
          </div>
        </div>

        {/* Notes preview */}
        {(s.additional_notes || s.behavioral_notes) && (
          <div style={{
            borderRadius: 10, padding: "0.625rem 0.75rem",
            fontSize: "0.78rem", fontWeight: 600,
            background: "rgba(255,248,218,0.7)", color: "#3a5020",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            "{s.additional_notes || s.behavioral_notes}"
          </div>
        )}

        {/* No photos badge */}
        {photos.length === 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            padding: "0.3rem 0.6rem", borderRadius: 6, width: "fit-content",
            background: "rgba(180,140,60,0.08)",
            border: "1px dashed rgba(180,140,60,0.25)",
          }}>
            <IconCamera size={11} style={{ color: "#b4903a", opacity: 0.5 }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9aaa80" }}>No photos</span>
          </div>
        )}

        {/* View button */}
        <button
          onClick={() => onView(s)}
          style={{
            marginTop: "auto", width: "100%",
            padding: "0.5rem", borderRadius: 12,
            fontSize: "0.78rem", fontWeight: 900,
            border: "1px solid rgba(90,170,48,0.3)",
            background: "rgba(28,79,9,0.07)", color: "#1c4f09",
            cursor: "pointer", transition: "background 0.15s, color 0.15s, border-color 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#16a34a";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "#16a34a";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(28,79,9,0.07)";
            e.currentTarget.style.color = "#1c4f09";
            e.currentTarget.style.borderColor = "rgba(90,170,48,0.3)";
          }}>
          <IconEye size={14} /> View Full Report
        </button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function SurveyPanel({ show }) {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [viewTarget, setViewTarget] = useState(null);
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 12;
  usePageTitle("Feedback Reports");

  const load = async (f) => {
    setLoading(true);
    try {
      let url = "/api/surveys/admin/";
      const params = new URLSearchParams();
      if (f === "7_day" || f === "30_day" || f === "90_day") params.set("survey_type", f);
      if (f === "health") params.set("health_flag", "true");
      if ([...params].length) url += "?" + params.toString();
      const res  = await djFetch(url);
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { if (show) load(filter); }, [show, filter]);
  useEffect(() => { setPage(1); }, [filter]);

  const totalPages  = Math.ceil(reports.length / PAGE_SIZE);
  const pagedReports = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const avgRating   = reports.length
    ? (reports.reduce((s, x) => s + parseInt(x.rating || 0), 0) / reports.length).toFixed(1)
    : "—";
  const healthCount = reports.filter(s => s.health_flag || s.showing_illness).length;
  const withPhotos  = reports.filter(s => normalizePhotos(s.photos).length > 0).length;

  const tabs = [
  { key: "all",    label: "All" },
  { key: "7_day",  label: "7-Day" },
  { key: "30_day", label: "30-Day" },
  { key: "90_day", label: "90-Day" },
  { key: "health", label: "Health flags", warn: true },
];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.875rem, 3vw, 1.25rem)" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        alignItems: "flex-start", justifyContent: "space-between",
        gap: "0.875rem",
      }}>
        <div>
          <div style={{
            fontWeight: 900, fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1rem, 4vw, 1.2rem)", color: "#1a4a08",
          }}>
            Feedback Reports
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, marginTop: 2, color: "#9aaa80" }}>
            Post-adoption feedback — 7-day &amp; 30-day check-ins with pet photos
          </div>
        </div>

        {/* Summary stat pills */}
        <div style={{
          display: "flex", gap: "0.5rem", flexWrap: "wrap",
          /* On very small screens they go full-width below the title */
          width: "100%", maxWidth: "none",
        }}>
          {[
            { label: "Avg Rating",  value: avgRating,      warn: false },
            { label: "Total",       value: reports.length,  warn: false },
            { label: "With Photos", value: withPhotos,      warn: false, icon: true },
            { label: "Health",      value: healthCount,     warn: healthCount > 0 },
          ].map(({ label, value, warn, icon }) => (
            <div key={label} style={{
              borderRadius: 12, border: `1px solid ${warn ? "rgba(192,48,48,0.3)" : "#ddd0a8"}`,
              background: "#fffce8",
              padding: "0.375rem 0.75rem", textAlign: "center",
              flex: "1 1 auto", minWidth: 60,
            }}>
              <div style={{
                fontSize: "clamp(1rem, 4vw, 1.25rem)", fontWeight: 900,
                color: warn ? "#c03030" : "#1a4a08",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem",
              }}>
                {icon && <IconCamera size={14} style={{ color: "#5a8a40" }} />}
                {value}
              </div>
              <div style={{
                fontSize: "0.6rem", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {tabs.map(t => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); load(t.key); }}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: 12, fontSize: "0.78rem", fontWeight: 900,
                border: `1px solid ${active
                  ? (t.warn ? "#dc2626" : "#16a34a")
                  : (t.warn ? "rgba(220,38,38,0.3)" : "#ddd0a8")}`,
                background: active
                  ? (t.warn ? "#dc2626" : "#16a34a")
                  : "transparent",
                color: active
                  ? "#fff"
                  : (t.warn ? "#dc2626" : "#7a9060"),
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.3rem",
                transition: "all 0.15s",
              }}>
              {t.warn && <IconTriangle size={11} />}
              {t.label}
            </button>
          );
        })}

        {/* Refresh */}
        <button
          onClick={() => load(filter)}
          disabled={loading}
          style={{
            marginLeft: "auto", padding: "0.375rem 0.75rem",
            borderRadius: 12, fontSize: "0.78rem", fontWeight: 700,
            border: "1px solid #ddd0a8", background: "transparent",
            color: "#7a9060", cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: "0.35rem",
            opacity: loading ? 0.5 : 1, transition: "opacity 0.15s",
          }}>
          <IconRefresh size={13} style={loading ? { animation: "spin 0.8s linear infinite" } : {}} />
          Refresh
        </button>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "2.5px solid #16a34a", borderTopColor: "transparent",
            animation: "spin 0.75s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <IconClipboard size={44} style={{ color: "#9aaa80", opacity: 0.4, display: "block", margin: "0 auto 0.75rem" }} />
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9aaa80" }}>
            No feedback reports found
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          /*
           * Fluid responsive grid:
           *  - 1 col on phones (<360px effectively)
           *  - 2 cols when there's room (~480px+)
           *  - 3 cols at wider breakpoints (~860px+)
           */
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
          gap: "clamp(0.625rem, 2vw, 1rem)",
        }}>
          {pagedReports.map((s, i) => (
            <ReportCard key={s.id || i} s={s} onView={setViewTarget} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "0.4rem 0.75rem", borderRadius: 12, border: "1px solid #ddd0a8", background: "transparent", color: page === 1 ? "#9aaa80" : "#7a9060", cursor: page === 1 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.78rem" }}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              style={{ width: 32, height: 32, borderRadius: 12, border: `1px solid ${n === page ? "#16a34a" : "#ddd0a8"}`, background: n === page ? "#16a34a" : "transparent", color: n === page ? "#fff" : "#7a9060", cursor: "pointer", fontWeight: n === page ? 900 : 700, fontSize: "0.78rem" }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "0.4rem 0.75rem", borderRadius: 12, border: "1px solid #ddd0a8", background: "transparent", color: page === totalPages ? "#9aaa80" : "#7a9060", cursor: page === totalPages ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.78rem" }}>
            Next →
          </button>
        </div>
      )}

      <ReportDetailModal
        s={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}