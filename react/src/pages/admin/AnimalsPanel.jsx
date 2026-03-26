// ── ANIMALS PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, healthBadge, statusBadge
} from "../../shared";

const TYPE_ICONS = { Dog: "🐶", Cat: "🐱", Bird: "🐦", Rabbit: "🐰", Other: "🐾" };
const TYPE_COLORS = { Dog: "#2a7010", Cat: "#7a3dc0", Bird: "#0a7ab4", Rabbit: "#c87820", Other: "#6a7a50" };

export default function AnimalsPanel({ show }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(null); // null | "add" | "edit"
  const [form,    setForm]    = useState({});
  const [delModal, setDel]    = useState(null);
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

  const save = async () => {
    if (!form.name?.trim()) { toast("Name is required", "error"); return; }
    try {
      const r = await phpApi(form.id ? "update_animal" : "add_animal", form);
      if (r.success) { toast(form.id ? "Animal updated" : "Animal added", "success"); setModal(null); load(); }
      else toast(r.message || "Error saving", "error");
    } catch { toast("Server error", "error"); }
  };

  const del = async () => {
    try {
      await phpApi("delete", { type: "animal", id: delModal.id });
      toast("Animal deleted", "success");
      setDel(null); load();
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
          <button
            onClick={() => { setForm({ type: "Dog", health: "Healthy", status: "Available" }); setModal("add"); }}
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
        <Table headers={["Name", "Type", "Breed", "Age", "Health", "Status", "Actions"]} empty="No animals yet — add one!">
          {filtered.map(a => (
            <Tr key={a.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${TYPE_COLORS[a.type] || "#6a7a50"}18` }}>
                    {TYPE_ICONS[a.type] || "🐾"}
                  </div>
                  <span className="font-black">{a.name}</span>
                </div>
              </Td>
              <Td>{a.type}</Td>
              <Td>{a.breed || <span style={{ color: "#c0b080" }}>—</span>}</Td>
              <Td>{a.age  || <span style={{ color: "#c0b080" }}>—</span>}</Td>
              <Td><Badge color={healthBadge(a.health)}>{a.health}</Badge></Td>
              <Td><Badge color={statusBadge(a.status)}>{a.status}</Badge></Td>
              <Td>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setForm({ ...a }); setModal("edit"); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    ✏ Edit
                  </button>
                  <button
                    onClick={() => setDel(a)}
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

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit Animal" : "Add New Animal"}
        icon="🐾"
        footer={
          <>
            <BtnCancel onClick={() => setModal(null)} />
            <BtnConfirm onClick={save}>💾 Save Animal</BtnConfirm>
          </>
        }>
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

      {/* Delete Modal */}
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