// ── ANIMALS PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, healthBadge, statusBadge
} from "../../shared";
import api from "../../config/axios";
import { usePageTitle } from "../../hooks/usePageTitle";

const TYPE_COLORS = { Dog: "#2a7010", Cat: "#7a3dc0", Bird: "#0a7ab4", Rabbit: "#c87820", Other: "#6a7a50" };
const PAGE_SIZE = 10;

// ── SVG icon components ────────────────────────────────────────────────────────
function IcoDog({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.5C10 4.12 11.12 3 12.5 3S15 4.12 15 5.5v1l2.5-.5 1 3-2 1v4l-1 3H9l-1-3V10L6 9l1-3 3 .5v-1z" />
      <circle cx="10.5" cy="8.5" r="0.5" fill={color} stroke="none" />
      <circle cx="14.5" cy="8.5" r="0.5" fill={color} stroke="none" />
      <path d="M9 18v2M15 18v2" />
    </svg>
  );
}
function IcoCat({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6V3l3 3h10l3-3v3c0 5-2 9-8 9S4 11 4 6z" />
      <path d="M9 18v2M15 18v2M9 15c1 1 5 1 6 0" />
      <circle cx="9.5" cy="9" r="0.5" fill={color} stroke="none" />
      <circle cx="14.5" cy="9" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}
function IcoBird({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4c-2 0-4 1-5 3H8a5 5 0 0 0 0 10h8l4-4V4z" />
      <path d="M12 17v4M8 17v4" />
      <circle cx="17" cy="7" r="1" fill={color} stroke="none" />
    </svg>
  );
}
function IcoRabbit({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3c0 3 1 5 4 5s4-2 4-5" />
      <ellipse cx="12" cy="14" rx="5" ry="5" />
      <path d="M9 19v2M15 19v2" />
      <circle cx="10" cy="13" r="0.5" fill={color} stroke="none" />
      <circle cx="14" cy="13" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}
function IcoPaw({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="4" />
      <circle cx="7"  cy="8"  r="1.5" />
      <circle cx="17" cy="8"  r="1.5" />
      <circle cx="5"  cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
function IcoCamera({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IcoEdit({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IcoTrash({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IcoSave({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
function IcoPlus({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const TYPE_SVG = {
  Dog:    (color, size) => <IcoDog    color={color} size={size} />,
  Cat:    (color, size) => <IcoCat    color={color} size={size} />,
  Bird:   (color, size) => <IcoBird   color={color} size={size} />,
  Rabbit: (color, size) => <IcoRabbit color={color} size={size} />,
  Other:  (color, size) => <IcoPaw    color={color} size={size} />,
};
const SPRING = "/api";

function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem", padding: "0.25rem 0.55rem", borderRadius: 6, background: "rgba(192,48,48,0.08)", border: "1px solid rgba(192,48,48,0.22)" }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6" cy="6" r="5.5" stroke="#c03030" strokeWidth="1" />
        <path d="M6 3.5V6.5" stroke="#c03030" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6" cy="8.5" r="0.6" fill="#c03030" />
      </svg>
      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#c03030" }}>{msg}</span>
    </div>
  );
}

function resolvePhoto(animal) {
  if (animal.photoData && animal.photoType) return `data:${animal.photoType};base64,${animal.photoData}`;
  if (animal.photo) {
    if (animal.photo.startsWith("data:") || animal.photo.startsWith("http")) return animal.photo;
    return `/uploads${animal.photo}`;
  }
  return null;
}

function AnimalAvatar({ animal, size = 38 }) {
  const src = resolvePhoto(animal);
  if (src) {
    return (
      <img src={src} alt={animal.name}
        style={{ width: size, height: size, borderRadius: 10, flexShrink: 0,
                 objectFit: "cover", border: "2px solid rgba(42,112,16,0.2)" }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0,
                  background: `${TYPE_COLORS[animal.type] || "#6a7a50"}18`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
      {(TYPE_SVG[animal.type] || TYPE_SVG.Other)(TYPE_COLORS[animal.type] || "#6a7a50", Math.round(size * 0.52))}
    </div>
  );
}

function PhotoUploader({ existingUrl, file, onChange }) {
  const inputRef = useRef();
  const preview  = file ? URL.createObjectURL(file) : existingUrl;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ width: 80, height: 80, borderRadius: 14, flexShrink: 0, cursor: "pointer",
                 border: "2px dashed rgba(42,112,16,0.35)", overflow: "hidden",
                 background: preview ? "transparent" : "rgba(42,112,16,0.04)",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 transition: "border-color .15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(42,112,16,0.7)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(42,112,16,0.35)"}>
        {preview
          ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <IcoCamera size={26} color="rgba(42,112,16,0.35)" />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                   cursor: "pointer", background: "rgba(42,112,16,0.1)",
                   border: "1px solid rgba(42,112,16,0.25)", color: "#2a7010" }}>
          {preview ? "Change photo" : "Upload photo"}
        </button>
        {preview && (
          <button type="button" onClick={() => onChange(null, true)}
            style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                     cursor: "pointer", background: "rgba(192,48,48,0.07)",
                     border: "1px solid rgba(192,48,48,0.2)", color: "#c03030" }}>
            Remove
          </button>
        )}
        <span style={{ fontSize: 10, color: "#9aaa80", fontWeight: 600 }}>JPG, PNG, WEBP · max 2 MB</span>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={e => onChange(e.target.files?.[0] || null, false)} />
    </div>
  );
}

function normaliseSb(a) {
  return {
    _id:             a.id,
    id:              `sb_${a.id}`,
    name:            a.name,
    type:            a.type,
    breed:           a.breed,
    age:             a.age,
    health:          a.health,
    status:          a.status,
    notes:           a.notes,
    photoData:       a.photoData  || null,
    photoType:       a.photoType  || null,
    _fromSpringBoot: true,
  };
}

// ── Animal card (mobile) ──────────────────────────────────────────────────────
function AnimalCard({ animal, onEdit, onDelete }) {
  return (
    <div style={{
      background: "rgba(255,248,225,0.85)", border: "1.5px solid rgba(180,140,60,0.22)",
      borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "flex-start", gap: 12,
      boxShadow: "0 2px 8px rgba(100,70,20,0.07)",
    }}>
      <AnimalAvatar animal={animal} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 900, fontSize: "0.88rem", color: "#1a4a08" }}>{animal.name}</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Badge color={healthBadge(animal.health)}>{animal.health}</Badge>
            <Badge color={statusBadge(animal.status)}>{animal.status}</Badge>
          </div>
        </div>
        <div style={{ marginTop: 3, fontSize: "0.75rem", color: "#6a7a50", fontWeight: 700 }}>
          {[animal.type, animal.breed, animal.age].filter(Boolean).join(" · ") || "—"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => onEdit(animal)}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, fontSize: "0.72rem", fontWeight: 800,
                     border: "1.5px solid #ddd0a8", color: "#7a9060", background: "rgba(255,255,255,0.6)",
                     cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <IcoEdit size={12} color="#7a9060" /> Edit
          </button>
          <button onClick={() => onDelete(animal)}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, fontSize: "0.72rem", fontWeight: 800,
                     border: "1.5px solid rgba(192,48,48,0.25)", color: "#c03030", background: "rgba(192,48,48,0.05)",
                     cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <IcoTrash size={12} color="#c03030" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // always show first, last, current, and ±1 around current
    if (
      i === 1 || i === totalPages ||
      i === page || i === page - 1 || i === page + 1
    ) {
      pages.push(i);
    } else if (i === page - 2 || i === page + 2) {
      pages.push("…");
    }
  }
  // dedupe the ellipses
  const deduped = pages.filter((p, i) => p !== "…" || pages[i - 1] !== "…");

  const btnSt = (active) => ({
    minWidth: 32, height: 32, borderRadius: 8, border: "none",
    background: active ? "#1c4f09" : "rgba(255,253,240,0.95)",
    border: active ? "none" : "1px solid rgba(180,140,60,0.32)",
    color: active ? "#fff" : "#5a7040",
    fontWeight: active ? 900 : 700, fontSize: "0.78rem",
    cursor: active ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 6px",
    transition: "all 0.15s",
  });

  const navSt = (disabled) => ({
    height: 32, padding: "0 10px", borderRadius: 8,
    border: "1px solid rgba(180,140,60,0.32)",
    background: "rgba(255,253,240,0.95)",
    color: disabled ? "#c0b080" : "#5a7040",
    fontWeight: 700, fontSize: "0.78rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      <button style={navSt(page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>
      {deduped.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} style={{ color: "#9aaa80", fontSize: "0.78rem", padding: "0 2px" }}>…</span>
          : <button key={p} style={btnSt(p === page)} onClick={() => p !== page && onChange(p)}>{p}</button>
      )}
      <button style={navSt(page === totalPages)} disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AnimalsPanel({ show }) {
  const [animals,     setAnimals]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [formErrs,    setFormErrs]    = useState({});
  const [photoFile,   setPhotoFile]   = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [delModal,    setDel]         = useState(null);
  const [isMobile,    setIsMobile]    = useState(false);
  const { show: toast } = useToast();

  usePageTitle("Animals Management");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let phpAnimals = [];
      try {
        const r = await phpApi("get_animals");
        phpAnimals = r?.success ? (r.data || []) : [];
      } catch { phpAnimals = []; }

      let sbAnimals = [];
      try {
        const sbRes  = await api.get(`${SPRING}/animals`);
        const sbData = sbRes.data;
        sbAnimals = Array.isArray(sbData)
          ? sbData
              .filter(a => !phpAnimals.some(
                p => p.name?.toLowerCase() === a.name?.toLowerCase() &&
                     p.type?.toLowerCase() === a.type?.toLowerCase()
              ))
              .map(normaliseSb)
          : [];
      } catch (sbErr) {
        console.warn("Spring Boot animals unavailable:", sbErr?.response?.status ?? sbErr.message);
      }

      setAnimals([...phpAnimals, ...sbAnimals]);
    } catch (err) {
      console.error("load animals:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (show) load(); }, [show, load]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setForm({ type: "Dog", health: "Healthy", status: "Available" });
    setFormErrs({});
    setPhotoFile(null);
    setRemovePhoto(false);
    setModal("add");
  };

  const openEdit = (animal) => {
    setForm({ ...animal });
    setFormErrs({});
    setPhotoFile(null);
    setRemovePhoto(false);
    setModal("edit");
  };

  const handlePhotoChange = (file, remove) => {
    if (remove) {
      setPhotoFile(null);
      setRemovePhoto(true);
      setForm(f => ({ ...f, photoData: null, photoType: null, photo: null }));
    } else {
      if (file && file.size > 2 * 1024 * 1024) { toast("Photo must be under 2 MB", "error"); return; }
      setPhotoFile(file);
      setRemovePhoto(false);
    }
  };

  function validateAnimal(f) {
    const e = {};
    if (!f.name?.trim()) e.name = "Animal name is required.";
    return e;
  }

  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFormErrs(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const save = async () => {
    const e = validateAnimal(form);
    setFormErrs(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      if (form._fromSpringBoot === false || (modal === "edit" && !form._fromSpringBoot)) {
        const res = await phpApi("update_animal", {
          id: form.id, name: form.name, type: form.type || "Dog",
          breed: form.breed || "", age: form.age || "",
          health: form.health || "Healthy", status: form.status || "Available", notes: form.notes || "",
        }, photoFile || undefined);
        if (res?.success) { toast("Animal updated", "success"); setModal(null); load(); }
        else toast(res?.message || "Error saving", "error");
        setSaving(false);
        return;
      }
      const isEdit   = modal === "edit" && form._fromSpringBoot && form._id;
      const endpoint = isEdit ? `${SPRING}/animals/${form._id}` : `${SPRING}/animals`;
      const method   = isEdit ? "put" : "post";
      const payload  = { name: form.name, type: form.type || "Dog", breed: form.breed || "",
                         age: form.age || "", health: form.health || "Healthy",
                         status: form.status || "Available", notes: form.notes || "" };
      if (photoFile) {
        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        fd.append("photo", photoFile);
        await api[method](endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api[method](endpoint, payload);
      }
      toast(isEdit ? "Animal updated" : "Animal added", "success");
      setModal(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "Error saving", "error");
    }
    setSaving(false);
  };

  const del = async () => {
    try {
      if (delModal._fromSpringBoot) {
        await api.delete(`${SPRING}/animals/${delModal._id}`);
      } else {
        await phpApi("delete", { type: "animal", id: delModal.id });
      }
      toast("Animal deleted", "success");
      setDel(null);
      load();
    } catch { toast("Error deleting", "error"); }
  };

  // ── Filtering + pagination ─────────────────────────────────────────────────
  const filtered   = animals.filter(a =>
    `${a.name} ${a.type} ${a.breed}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <style>{`
        .animals-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .animals-form-grid { grid-template-columns: 1fr; }
        }
        .animals-card-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        /* Make table horizontally scrollable on small screens */
        .animals-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
        }
      `}</style>

      {/* ── Header ── */}
      <PageHeader
        title="Manage Animals"
        subtitle="Add, edit or update animals in the shelter"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
            style={{ background: "#1c4f09" }}>
            <IcoPlus size={15} color="#fff" /> Add Animal
          </button>
        }
      />

      {/* ── Search + count ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search animals…" />
        </div>
        {filtered.length > 0 && (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9aaa80", whiteSpace: "nowrap" }}>
            {filtered.length} animal{filtered.length !== 1 ? "s" : ""}
            {search && ` found`}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9aaa80", fontSize: "0.85rem", fontWeight: 700 }}>
          {search ? `No animals matching "${search}"` : "No animals yet — add one!"}
        </div>
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <>
          <div className="animals-card-list">
            {paginated.map(a => (
              <AnimalCard key={a.id} animal={a} onEdit={openEdit} onDelete={setDel} />
            ))}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        /* ── Desktop: table with horizontal scroll wrapper ── */
        <>
          <div className="animals-table-wrap">
            <Table
              headers={["Animal", "Type", "Breed", "Age", "Health", "Status", "Actions"]}
              empty="No animals yet — add one!">
              {paginated.map(a => (
                <Tr key={a.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <AnimalAvatar animal={a} size={38} />
                      <span className="font-black">{a.name}</span>
                    </div>
                  </Td>
                  <Td>{a.type}</Td>
                  <Td>{a.breed || <span style={{ color: "#c0b080" }}>—</span>}</Td>
                  <Td>{a.age   || <span style={{ color: "#c0b080" }}>—</span>}</Td>
                  <Td><Badge color={healthBadge(a.health)}>{a.health}</Badge></Td>
                  <Td><Badge color={statusBadge(a.status)}>{a.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        style={{ borderColor: "#ddd0a8", color: "#7a9060", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <IcoEdit size={12} color="#7a9060" /> Edit
                      </button>
                      <button onClick={() => setDel(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        style={{ borderColor: "#ddd0a8", color: "#7a9060", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <IcoTrash size={12} color="#7a9060" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* ── Page info ── */}
      {totalPages > 1 && (
        <div style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "#b0a07a" }}>
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit Animal" : "Add New Animal"}
        icon={<IcoPaw size={18} color="#2a7010" />}
        footer={
          <>
            <BtnCancel onClick={() => setModal(null)} />
            <BtnConfirm onClick={save} disabled={saving}>
              {saving ? "Saving…" : <><IcoSave size={14} color="currentColor" style={{ marginRight: 5 }} /> Save Animal</>}
            </BtnConfirm>
          </>
        }>

        {(modal === "add" || form._fromSpringBoot) && (
          <Field label="Photo">
            <PhotoUploader
              existingUrl={resolvePhoto(form)}
              file={photoFile}
              onChange={handlePhotoChange}
            />
          </Field>
        )}

        <div className="animals-form-grid">
          <Field label="Name *">
            <Input
              value={form.name || ""}
              onChange={e => setField("name", e.target.value)}
              placeholder="Animal name"
              style={formErrs.name
                ? { border: "1.5px solid #c03030", boxShadow: "0 0 0 3px rgba(192,48,48,0.10)" }
                : {}}
            />
            <FieldErr msg={formErrs.name} />
          </Field>

          <Field label="Type">
            <Select value={form.type || "Dog"} onChange={e => setField("type", e.target.value)}>
              {["Dog", "Cat", "Bird", "Rabbit", "Other"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>

          <Field label="Breed">
            <Input value={form.breed || ""} onChange={e => setField("breed", e.target.value)} placeholder="e.g. Labrador" />
          </Field>

          <Field label="Age">
            <Input value={form.age || ""} onChange={e => setField("age", e.target.value)} placeholder="e.g. 2 years" />
          </Field>

          <Field label="Health Status">
            <Select value={form.health || "Healthy"} onChange={e => setField("health", e.target.value)}>
              {["Healthy", "Needs Care", "Under Treatment"].map(h => <option key={h}>{h}</option>)}
            </Select>
          </Field>

          <Field label="Adoption Status">
            <Select value={form.status || "Available"} onChange={e => setField("status", e.target.value)}>
              {["Available", "Pending", "Adopted", "Not Available"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Input value={form.notes || ""} onChange={e => setField("notes", e.target.value)} placeholder="Any additional notes…" />
        </Field>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        open={!!delModal}
        onClose={() => setDel(null)}
        title="Confirm Delete"
        icon={<IcoTrash size={18} color="#c03030" />}
        footer={
          <>
            <BtnCancel onClick={() => setDel(null)} />
            <BtnConfirm onClick={del} red>Delete Animal</BtnConfirm>
          </>
        }>
        <p className="text-sm font-semibold" style={{ color: "#3a5020" }}>
          Are you sure you want to delete{" "}
          <strong className="font-black">"{delModal?.name}"</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}