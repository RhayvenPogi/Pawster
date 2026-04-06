// ── USERS PANEL ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, roleBadge
} from "../../shared";

// ─── Inline field error ───────────────────────────────────────────────────────
function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem", padding: "0.25rem 0.55rem", borderRadius: 6, background: "rgba(192,48,48,0.08)", border: "1px solid rgba(192,48,48,0.22)" }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6" cy="6" r="5.5" stroke="#c03030" strokeWidth="1"/>
        <path d="M6 3.5V6.5" stroke="#c03030" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="8.5" r="0.6" fill="#c03030"/>
      </svg>
      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#c03030" }}>{msg}</span>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.85rem" }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#1c4f09" }} />
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: step === 2 ? "#1c4f09" : "#d8e8c0" }} />
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7a9060", whiteSpace: "nowrap" }}>
        Step {step} of 2
      </span>
    </div>
  );
}

export default function UsersPanel({ show: isVisible }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState("all");
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [delModal, setDel]        = useState(null);
  const [errs, setErrs]           = useState({});
  const [idPreview, setIdPreview] = useState(null);
  const [step, setStep]           = useState(1);
  const { show: toast }           = useToast();

  // ── Load users ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await phpApi("get_users", { role: roleFilter === "all" ? "" : roleFilter });
      if (r.success) setUsers(r.data || []);
      else toast(r.message || "Failed to load users", "error");
    } catch (err) {
      toast("Server error loading users", "error");
      console.error("load users error:", err);
    }
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { if (isVisible) load(); }, [isVisible, load]);

  // ── View ID file ──────────────────────────────────────────────────────────
  const viewId = (u) => {
    setIdPreview({
      url:     `/php/admin/dashboard?action=get_id_file&user_id=${u.id}`,
      name:    u.id_file_name || "ID File",
      isImage: /\.(jpg|jpeg|png|webp|gif)$/i.test(u.id_file_name || ""),
    });
  };

  // ── Validate step-1 fields ────────────────────────────────────────────────
  function validateStep1(f) {
    const e = {};
    if (!f.first_name?.trim()) e.first_name = "First name is required.";
    if (!f.last_name?.trim())  e.last_name  = "Last name is required.";
    if (!f.email?.trim())      e.email      = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(f.email.trim())) e.email = "Enter a valid email address.";
    if (!f.phone?.trim()) {
      e.phone = "Phone number is required.";
    } else if (!/^09\d{9}$/.test(f.phone.trim())) {
      e.phone = "Must be a valid PH number (e.g. 09123456789).";
    }
    return e;
  }

  // ── Live-clear field error on change ──────────────────────────────────────
  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrs(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ role: "user", is_active: 1, phone: "" });
    setErrs({});
    setStep(1);
    setModal("add");
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (u) => {
    setForm({ ...u });
    setErrs({});
    setStep(1);
    setModal("edit");
  };

  // ── Next: validate step 1 then advance ───────────────────────────────────
  const handleNext = () => {
    const e = validateStep1(form);
    setErrs(e);
    if (Object.keys(e).length) return;
    setErrs({});
    setStep(2);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = async () => {
    if (modal === "edit") {
      const e = validateStep1(form);
      setErrs(e);
      if (Object.keys(e).length) return;
    }

    try {
      if (form.id) {
        // Edit — goes through PHP
        const r = await phpApi("update_user", {
          id:         form.id,
          first_name: form.first_name,
          last_name:  form.last_name,
          email:      form.email,
          phone:      form.phone,
          role:       form.role,
          is_active:  form.is_active,
          address:    form.address  || "",
          city:       form.city     || "",
          province:   form.province || "",
          zip:        form.zip      || "",
        });
        if (r.success) {
          toast("User updated", "success");
          setModal(null);
          load();
        } else {
          setErrs({ api: r.message || "Error updating user" });
        }

      } else {
        // Add — goes through Spring Boot (handles password gen + email)
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.first_name,
            lastName:  form.last_name,
            email:     form.email,
            phone:     form.phone,
            role:      form.role,
            address:   form.address  || "",
            city:      form.city     || "",
            province:  form.province || "",
            zip:       form.zip      || "",
          }),
        });
        const r = await res.json();
        if (r.success) {
          toast("User added ✉️ credentials emailed!", "success");
          setModal(null);
          load();
        } else {
          setErrs({ api: r.message || "Error adding user" });
        }
      }

    } catch (err) {
      console.error("save user error:", err);
      setErrs({ api: "Server error — check console for details" });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const del = async () => {
    try {
      const r = await phpApi("delete", { type: "user", id: delModal.id });
      if (r.success) {
        toast("User deleted", "success");
        setDel(null);
        load();
      } else {
        toast(r.message || "Error deleting user", "error");
      }
    } catch (err) {
      console.error("delete user error:", err);
      toast("Server error deleting user", "error");
    }
  };

  // ── Toggle active status ──────────────────────────────────────────────────
  const toggleStatus = async (u) => {
    try {
      await phpApi("update_user_status", { id: u.id, is_active: u.is_active == 1 ? 0 : 1 });
      toast(`User ${u.is_active == 1 ? "deactivated" : "activated"}`, "info");
      load();
    } catch (err) {
      console.error("toggle status error:", err);
      toast("Server error updating status", "error");
    }
  };

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const isAdd  = modal === "add";
  const isEdit = modal === "edit";

  const inp = (key) => ({
    border:    errs[key] ? "1.5px solid #c03030" : undefined,
    boxShadow: errs[key] ? "0 0 0 3px rgba(192,48,48,0.10)" : undefined,
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="User Management"
        subtitle="Manage all registered accounts"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
            style={{ background: "#1c4f09" }}>
            + Add User
          </button>
        }
      />

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-[360px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span style={{ color: "#1c4f09" }}>Role:</span>
          <Select value={roleFilter} onChange={(e) => setRole(e.target.value)} className="w-36">
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Table
          headers={["User", "Email", "Phone", "Role", "Status", "ID File", "Joined", "Last Login", "Actions"]}
          empty="No users found.">
          {filtered.map(u => (
            <Tr key={u.id}>

              {/* Avatar + name */}
              <Td>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-green-200 overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                    {u.photo_name ? (
                      <img
                        src={`/api/users/${u.id}/photo/public`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">
                        {(u.first_name?.[0] || "").toUpperCase()}{(u.last_name?.[0] || "").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-sm">{u.first_name} {u.last_name}</div>
                    <div className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>#{u.id}</div>
                  </div>
                </div>
              </Td>

              <Td>{u.email}</Td>
              <Td className="text-xs">{u.phone || "—"}</Td>
              <Td><Badge color={roleBadge(u.role)}>{u.role}</Badge></Td>
              <Td><Badge color={u.is_active == 1 ? "green" : "red"}>{u.is_active == 1 ? "Active" : "Inactive"}</Badge></Td>

              {/* ID file */}
              <Td>
                {u.id_file_name ? (
                  <button
                    onClick={() => viewId(u)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                    style={{ borderColor: "#c5d8a0", color: "#4a7020" }}
                    title={u.id_file_name}>
                    🪪 View ID
                  </button>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: "#c0b080" }}>None</span>
                )}
              </Td>

              {/* Joined */}
              <Td className="text-xs whitespace-nowrap">
                {u.created_at
                  ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </Td>

              {/* Last login */}
              <Td className="text-xs">
                {u.last_login
                  ? new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : <span style={{ color: "#c0b080" }}>Never</span>}
              </Td>

              {/* Actions */}
              <Td>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}
                    title="Edit">✏</button>
                  <button
                    onClick={() => toggleStatus(u)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}
                    title={u.is_active == 1 ? "Deactivate" : "Activate"}>
                    {u.is_active == 1 ? "🚫" : "✅"}
                  </button>
                  <button
                    onClick={() => setDel(u)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}
                    title="Delete">🗑</button>
                </div>
              </Td>

            </Tr>
          ))}
        </Table>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isEdit ? "Edit User" : step === 1 ? "Add New User" : "Add New User — Address"}
        icon="👤"
        footer={
          <>
            {/* Back (add step 2) or Cancel */}
            {isAdd && step === 2 ? (
              <BtnCancel onClick={() => { setStep(1); setErrs({}); }}>← Back</BtnCancel>
            ) : (
              <BtnCancel onClick={() => setModal(null)} />
            )}

            {/* Next (add step 1) or Save */}
            {isAdd && step === 1 ? (
              <BtnConfirm onClick={handleNext}>Next →</BtnConfirm>
            ) : (
              <BtnConfirm onClick={save}>💾 Save</BtnConfirm>
            )}
          </>
        }>

        {/* API-level error */}
        {errs.api && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">
            {errs.api}
          </div>
        )}

        {/* Step indicator — add modal only */}
        {isAdd && <StepIndicator step={step} />}

        {/* ── STEP 1: Account info (and full edit modal) ───────────────────── */}
        {(isAdd && step === 1) || isEdit ? (
          <>
            {isAdd && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-xs font-bold flex items-center gap-2">
                ✉️ A random password will be auto-generated and emailed to the user.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *">
                <Input
                  value={form.first_name || ""}
                  onChange={e => setField("first_name", e.target.value)}
                  placeholder="e.g. Juan"
                  style={inp("first_name")}
                />
                <FieldErr msg={errs.first_name} />
              </Field>

              <Field label="Last Name *">
                <Input
                  value={form.last_name || ""}
                  onChange={e => setField("last_name", e.target.value)}
                  placeholder="e.g. Dela Cruz"
                  style={inp("last_name")}
                />
                <FieldErr msg={errs.last_name} />
              </Field>
            </div>

            <Field label="Email *">
              <Input
                type="email"
                value={form.email || ""}
                onChange={e => setField("email", e.target.value)}
                placeholder="example@email.com"
                style={inp("email")}
              />
              <FieldErr msg={errs.email} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone *">
                <Input
                  value={form.phone || ""}
                  onChange={e => setField("phone", e.target.value)}
                  placeholder="e.g. 09123456789"
                  maxLength={11}
                  style={inp("phone")}
                />
                <FieldErr msg={errs.phone} />
              </Field>

              <Field label="Role">
                <Select
                  value={form.role || "user"}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>
            </div>

            {/* Address fields shown on same page for Edit */}
            {isEdit && (
              <>
                <Field label="Address">
                  <Input
                    value={form.address || ""}
                    onChange={e => setField("address", e.target.value)}
                    placeholder="Street address"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <Input
                      value={form.city || ""}
                      onChange={e => setField("city", e.target.value)}
                      placeholder="City"
                    />
                  </Field>
                  <Field label="Province">
                    <Input
                      value={form.province || ""}
                      onChange={e => setField("province", e.target.value)}
                      placeholder="Province"
                    />
                  </Field>
                </div>

                <Field label="Zip / Postal Code">
                  <Input
                    value={form.zip || ""}
                    onChange={e => setField("zip", e.target.value)}
                    placeholder="Zip / Postal Code"
                  />
                </Field>
              </>
            )}
          </>
        ) : null}

        {/* ── STEP 2: Address (add modal only) ────────────────────────────── */}
        {isAdd && step === 2 && (
          <>
            <p className="text-xs font-semibold" style={{ color: "#9aaa80" }}>
              Address details are optional — you can update these later.
            </p>

            <Field label="Address">
              <Input
                value={form.address || ""}
                onChange={e => setField("address", e.target.value)}
                placeholder="Street address"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input
                  value={form.city || ""}
                  onChange={e => setField("city", e.target.value)}
                  placeholder="City"
                />
              </Field>
              <Field label="Province">
                <Input
                  value={form.province || ""}
                  onChange={e => setField("province", e.target.value)}
                  placeholder="Province"
                />
              </Field>
            </div>

            <Field label="Zip / Postal Code">
              <Input
                value={form.zip || ""}
                onChange={e => setField("zip", e.target.value)}
                placeholder="Zip / Postal Code"
              />
            </Field>
          </>
        )}

      </Modal>

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={!!delModal}
        onClose={() => setDel(null)}
        title="Confirm Delete"
        icon="🗑"
        footer={
          <>
            <BtnCancel onClick={() => setDel(null)} />
            <BtnConfirm onClick={del} red>Delete User</BtnConfirm>
          </>
        }>
        <p className="text-sm font-semibold" style={{ color: "#3a5020" }}>
          Delete <strong className="font-black">{delModal?.first_name} {delModal?.last_name}</strong>?
          This cannot be undone.
        </p>
      </Modal>

      {/* ── ID File Preview Modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!idPreview}
        onClose={() => setIdPreview(null)}
        title="ID Verification"
        icon="🪪"
        className="!w-full !max-w-full !p-0"
        contentClassName="!p-0 !overflow-visible"
        footer={
          <div className="flex justify-between items-center w-full px-4 py-2">
{idPreview && (
  <a
    href={idPreview.url}
    download={idPreview.name}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-50 hover:border-green-400 hover:text-green-700"
    style={{ borderColor: "#c5d8a0", color: "#4a7020" }}>
    ⬇ Download
  </a>
)}
            <BtnCancel onClick={() => setIdPreview(null)} />
          </div>
        }>
        {idPreview && (
          <div className="flex justify-center items-center p-4 w-full">
            <div
              className="bg-white rounded-xl shadow-lg flex justify-center items-center"
              style={{ maxWidth: "95vw", maxHeight: "90vh", width: "auto", height: "auto" }}>
              {idPreview.isImage ? (
                <img src={idPreview.url} alt="User ID" className="w-full h-auto max-h-[90vh] object-contain" />
              ) : (
                <object data={idPreview.url} type="application/pdf" style={{ width: "100%", height: "90vh", border: "none" }}>
                  <p className="text-center text-sm p-4" style={{ color: "#7a9060" }}>
                    PDF preview unavailable —{" "}
                    <a href={idPreview.url} download style={{ color: "#1c4f09", textDecoration: "underline" }}>
                      Download to view
                    </a>
                  </p>
                </object>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}