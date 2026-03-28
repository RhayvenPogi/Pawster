// ── ANIMALS PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, healthBadge, statusBadge
} from "../../shared";

const TYPE_ICONS  = { Dog: "🐶", Cat: "🐱", Bird: "🐦", Rabbit: "🐰", Other: "🐾" };
const TYPE_COLORS = { Dog: "#2a7010", Cat: "#7a3dc0", Bird: "#0a7ab4", Rabbit: "#c87820", Other: "#6a7a50" };

function photoUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:8081${path}`;
}

// ── Animal avatar (table) ─────────────────────────────────────────────────────
function AnimalAvatar({ animal, size = 38 }) {
  const src = photoUrl(animal.photo);
  if (src) {
    return (
      <img src={src} alt={animal.name}
        style={{
          width: size, height: size, borderRadius: 10, flexShrink: 0,
          objectFit: "cover", border: "2px solid rgba(42,112,16,0.2)",
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `${TYPE_COLORS[animal.type] || "#6a7a50"}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5,
    }}>
      {TYPE_ICONS[animal.type] || "🐾"}
    </div>
  );
}

// ── Photo uploader widget (modal) ─────────────────────────────────────────────
function PhotoUploader({ existingUrl, file, onChange }) {
  const inputRef = useRef();
  const preview  = file ? URL.createObjectURL(file) : photoUrl(existingUrl);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div onClick={() => inputRef.current?.click()} style={{
        width: 80, height: 80, borderRadius: 14, flexShrink: 0, cursor: "pointer",
        border: "2px dashed rgba(42,112,16,0.35)", overflow: "hidden",
        background: preview ? "transparent" : "rgba(42,112,16,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(42,112,16,0.7)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(42,112,16,0.35)"}
      >
        {preview
          ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 28, opacity: 0.4 }}>📷</span>
        }
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button type="button" onClick={() => inputRef.current?.click()} style={{
          padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer",
          background: "rgba(42,112,16,0.1)", border: "1px solid rgba(42,112,16,0.25)", color: "#2a7010",
        }}>
          {preview ? "Change photo" : "Upload photo"}
        </button>
        {preview && (
          <button type="button" onClick={() => onChange(null, true)} style={{
            padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer",
            background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.2)", color: "#c03030",
          }}>
            Remove
          </button>
        )}
        <span style={{ fontSize: 10, color: "#9aaa80", fontWeight: 600 }}>JPG, PNG, WEBP · max 2 MB</span>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={e => onChange(e.target.files?.[0] || null, false)}
      />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AnimalsPanel({ show }) {
  const [animals,     setAnimals]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [photoFile,   setPhotoFile]   = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [delModal,    setDel]         = useState(null);
  const { show: toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await phpApi("get_animals");
      if (r.success) setAnimals(r.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (show) load(); }, [show, load]);

  const openAdd = () => {
    setForm({ type: "Dog", health: "Healthy", status: "Available" });
    setPhotoFile(null);
    setRemovePhoto(false);
    setModal("add");
  };

  const openEdit = (animal) => {
    setForm({ ...animal });
    setPhotoFile(null);
    setRemovePhoto(false);
    setModal("edit");
  };

  // file=null + remove=true  → user clicked "Remove"
  // file=File + remove=false → user picked a new file
  const handlePhotoChange = (file, remove) => {
    if (remove) {
      setPhotoFile(null);
      setRemovePhoto(true);
      setForm(f => ({ ...f, photo: null }));
    } else {
      if (file && file.size > 2 * 1024 * 1024) {
        toast("Photo must be under 2 MB", "error");
        return;
      }
      setPhotoFile(file);
      setRemovePhoto(false);
    }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const data = {
        ...(form.id && { id: form.id }),
        name:   form.name,
        type:   form.type   || "Dog",
        breed:  form.breed  || "",
        age:    form.age    || "",
        health: form.health || "Healthy",
        status: form.status || "Available",
        notes:  form.notes  || "",
      };

      // Tell PHP to keep the old URL if user didn't change or remove the photo
      if (!photoFile && !removePhoto && form.photo) {
        data.existing_photo = form.photo;
      }

      const r = await phpApi(
        form.id ? "update_animal" : "add_animal",
        data,
        photoFile  // File or null — phpApi appends it as "photo" when present
      );
      console.log("SAVE RESPONSE:", JSON.stringify(r)); // ← add this

      if (r.success) {
        toast(form.id ? "Animal updated" : "Animal added", "success");
        setModal(null);
        load();
      } else {
        toast(r.message || "Error saving", "error");
      }
    } catch {
      toast("Server error", "error");
    }
    setSaving(false);
  };

  const del = async () => {
    try {
      await phpApi("delete", { type: "animal", id: delModal.id });
      toast("Animal deleted", "success");
      setDel(null);
      load();
    } catch { toast("Error deleting", "error"); }
  };

  const filtered = animals.filter(a =>
    `${a.name} ${a.type} ${a.breed}`.toLowerCase().includes(search.toLowerCase())
  );

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
        <Table headers={["Animal", "Type", "Breed", "Age", "Health", "Status", "Actions"]} empty="No animals yet — add one!">
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
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>✏ Edit
                  </button>
                  <button onClick={() => setDel(a)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>🗑
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

        <Field label="Photo">
          <PhotoUploader
            existingUrl={form.photo || null}
            file={photoFile}
            onChange={handlePhotoChange}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <Input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Animal name" />
          </Field>
          <Field label="Type">
            <Select value={form.type || "Dog"} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["Dog","Cat","Bird","Rabbit","Other"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Breed">
            <Input value={form.breed || ""} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="e.g. Labrador" />
          </Field>
          <Field label="Age">
            <Input value={form.age || ""} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="e.g. 2 years" />
          </Field>
          <Field label="Health Status">
            <Select value={form.health || "Healthy"} onChange={e => setForm(f => ({ ...f, health: e.target.value }))}>
              {["Healthy","Needs Care","Under Treatment"].map(h => <option key={h}>{h}</option>)}
            </Select>
          </Field>
          <Field label="Adoption Status">
            <Select value={form.status || "Available"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {["Available","Pending","Adopted","Not Available"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
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
          Are you sure you want to delete <strong className="font-black">"{delModal?.name}"</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}