// ── ANIMALS PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, healthBadge, statusBadge
} from "../../shared";
import api from "../../config/axios";

const TYPE_ICONS  = { Dog: "🐶", Cat: "🐱", Bird: "🐦", Rabbit: "🐰", Other: "🐾" };
const TYPE_COLORS = { Dog: "#2a7010", Cat: "#7a3dc0", Bird: "#0a7ab4", Rabbit: "#c87820", Other: "#6a7a50" };
const SPRING = "/api";

// ── Inline field error ─────────────────────────────────────────────────────────
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
  if (animal.photoData && animal.photoType) {
    return `data:${animal.photoType};base64,${animal.photoData}`;
  }
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
                 objectFit: "cover", border: "2px solid rgba(42,112,16,0.2)" }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0,
                  background: `${TYPE_COLORS[animal.type] || "#6a7a50"}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: size * 0.5 }}>
      {TYPE_ICONS[animal.type] || "🐾"}
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
          : <span style={{ fontSize: 28, opacity: 0.4 }}>📷</span>}
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

// ── normaliseSb: maps Spring Boot animal to internal shape ──────────────────
function normaliseSb(a) {
  return {
    _id:             a.id,          // real numeric SB id — used for PUT/DELETE
    id:              `sb_${a.id}`,  // unique React key (avoids collisions with PHP ids)
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

export default function AnimalsPanel({ show }) {
  const [animals,      setAnimals]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);   // "add" | "edit" | null
  const [form,         setForm]         = useState({});
  const [formErrs,     setFormErrs]     = useState({});
  const [photoFile,    setPhotoFile]    = useState(null);
  const [removePhoto,  setRemovePhoto]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [delModal,     setDel]          = useState(null);
  const { show: toast } = useToast();

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. PHP animals — guard against empty / broken response
      let phpAnimals = [];
      try {
        const r = await phpApi("get_animals");
        phpAnimals = r?.success ? (r.data || []) : [];
      } catch {
        phpAnimals = [];
      }

      // 2. Spring Boot animals — api instance sends JWT automatically
      //    GET /api/animals is .permitAll() so no auth needed, but the
      //    shared axios instance attaches the token anyway (harmless).
      let sbAnimals = [];
      try {
        const sbRes  = await api.get(`${SPRING}/animals`);
        const sbData = sbRes.data;
        sbAnimals = Array.isArray(sbData)
          ? sbData
              // De-duplicate: skip SB animals already present in PHP list
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

  // ── Open modals ─────────────────────────────────────────────────────────────
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

  // ── Photo change ────────────────────────────────────────────────────────────
  const handlePhotoChange = (file, remove) => {
    if (remove) {
      setPhotoFile(null);
      setRemovePhoto(true);
      setForm(f => ({ ...f, photoData: null, photoType: null, photo: null }));
    } else {
      if (file && file.size > 2 * 1024 * 1024) {
        toast("Photo must be under 2 MB", "error");
        return;
      }
      setPhotoFile(file);
      setRemovePhoto(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
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

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = async () => {
    const e = validateAnimal(form);
    setFormErrs(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      // ── PHP animal: edit via phpApi, add is always SB ──────────────────────
      if (form._fromSpringBoot === false || (modal === "edit" && !form._fromSpringBoot)) {
        // Editing an existing PHP animal
        const res = await phpApi("update_animal", {
          id:     form.id,
          name:   form.name,
          type:   form.type   || "Dog",
          breed:  form.breed  || "",
          age:    form.age    || "",
          health: form.health || "Healthy",
          status: form.status || "Available",
          notes:  form.notes  || "",
        }, photoFile || undefined);

        if (res?.success) {
          toast("Animal updated", "success");
          setModal(null);
          load();
        } else {
          toast(res?.message || "Error saving", "error");
        }
        setSaving(false);
        return;
      }

      // ── Spring Boot: add or edit ───────────────────────────────────────────
      const isEdit   = modal === "edit" && form._fromSpringBoot && form._id;
      const endpoint = isEdit ? `${SPRING}/animals/${form._id}` : `${SPRING}/animals`;
      const method   = isEdit ? "put" : "post";

      const payload = {
        name:   form.name,
        type:   form.type   || "Dog",
        breed:  form.breed  || "",
        age:    form.age    || "",
        health: form.health || "Healthy",
        status: form.status || "Available",
        notes:  form.notes  || "",
      };

      if (photoFile) {
        // Multipart: Spring Boot must accept @RequestPart("data") + @RequestPart("photo")
        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        fd.append("photo", photoFile);
        await api[method](endpoint, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // No photo — send plain JSON (avoids multipart parsing issues on the server)
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

  // ── Delete ──────────────────────────────────────────────────────────────────
  const del = async () => {
    try {
      if (delModal._fromSpringBoot) {
        // Use the real numeric SB id stored in _id
        await api.delete(`${SPRING}/animals/${delModal._id}`);
      } else {
        // PHP animals use their own id field (plain numeric, no "sb_" prefix)
        await phpApi("delete", { type: "animal", id: delModal.id });
      }
      toast("Animal deleted", "success");
      setDel(null);
      load();
    } catch {
      toast("Error deleting", "error");
    }
  };

  const filtered = animals.filter(a =>
    `${a.name} ${a.type} ${a.breed}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Manage Animals"
        subtitle="Add, edit or update animals in the shelter"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
            style={{ background: "#1c4f09" }}>
            <span className="text-base">+</span> Add Animal
          </button>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search animals…" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Table
          headers={["Animal", "Type", "Breed", "Age", "Health", "Status", "Actions"]}
          empty="No animals yet — add one!">
          {filtered.map(a => (
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
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    ✏ Edit
                  </button>
                  <button onClick={() => setDel(a)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    🗑
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit Animal" : "Add New Animal"}
        icon="🐾"
        footer={
          <>
            <BtnCancel onClick={() => setModal(null)} />
            <BtnConfirm onClick={save} disabled={saving}>
              {saving ? "Saving…" : "💾 Save Animal"}
            </BtnConfirm>
          </>
        }>

        {/* Only show photo uploader for Spring Boot animals (PHP handles photos separately) */}
        {(modal === "add" || form._fromSpringBoot) && (
          <Field label="Photo">
            <PhotoUploader
              existingUrl={resolvePhoto(form)}
              file={photoFile}
              onChange={handlePhotoChange}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
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
        icon="🗑"
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