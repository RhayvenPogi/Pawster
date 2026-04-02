// ── USERS PANEL ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, roleBadge
} from "../../shared";

export default function UsersPanel({ show: isVisible }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("all");
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [delModal, setDel]      = useState(null);
  const [errs, setErrs]         = useState({});
  const [idPreview, setIdPreview] = useState(null); // { url, name }
  const { show: toast }         = useToast();

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

// ── View ID file in modal ──────────────────────────────────────────────────
const viewId = (u) => {
  setIdPreview({
    url:  `/php/admin/dashboard?action=get_id_file&user_id=${u.id}`,
    name: u.id_file_name || "ID File",
    isImage: /\.(jpg|jpeg|png|webp|gif)$/i.test(u.id_file_name || ""),
  });
};
  const save = async () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = "Required";
    if (!form.last_name?.trim())  e.last_name  = "Required";
    if (!form.email?.trim())      e.email      = "Required";
    if (!form.phone?.trim()) {
      e.phone = "Required";
    } else if (!/^09\d{9}$/.test(form.phone.trim())) {
      e.phone = "Invalid PH number (e.g. 09123456789)";
    }

    setErrs(e);
    if (Object.keys(e).length) return;

    try {
      if (form.id) {
        // ── Edit: use PHP API ──────────────────────────────────────────────
        const r = await phpApi("update_user", {
          id:         form.id,
          first_name: form.first_name,
          last_name:  form.last_name,
          email:      form.email,
          phone:      form.phone,
          role:       form.role,
          is_active:  form.is_active,
        });
        if (r.success) {
          toast("User updated", "success");
          setModal(null);
          load();
        } else {
          setErrs({ api: r.message || "Error updating user" });
        }
      } else {
        // ── Add: use Spring Boot API — password auto-generated & emailed ──
        const r = await fetch("/api/admin/users", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.first_name,
            lastName:  form.last_name,
            email:     form.email,
            phone:     form.phone,
            role:      form.role,
          }),
        }).then(res => res.json());

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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="User Management"
        subtitle="Manage all registered accounts"
        action={
          <button
            onClick={() => {
              setForm({ role: "user", is_active: 1, phone: "" });
              setErrs({});
              setModal("add");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
            style={{ background: "#1c4f09" }}>
            + Add User
          </button>
        }
      />

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

              {/* ── ID File column ───────────────────────────────────────── */}
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

              <Td className="text-xs whitespace-nowrap">
                {u.created_at
                  ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </Td>
              <Td className="text-xs">
                {u.last_login
                  ? new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : <span style={{ color: "#c0b080" }}>Never</span>}
              </Td>
              <Td>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setForm({ ...u }); setErrs({}); setModal("edit"); }}
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
        title={isEdit ? "Edit User" : "Add New User"}
        icon="👤"
        footer={
          <>
            <BtnCancel onClick={() => setModal(null)} />
            <BtnConfirm onClick={save}>💾 Save</BtnConfirm>
          </>
        }>

        {errs.api && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">
            {errs.api}
          </div>
        )}

        {isAdd && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-xs font-bold flex items-center gap-2">
            ✉️ A random password will be auto-generated and emailed to the user.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name *" error={errs.first_name}>
            <Input
              value={form.first_name || ""}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              placeholder="e.g. Juan"
            />
          </Field>
          <Field label="Last Name *" error={errs.last_name}>
            <Input
              value={form.last_name || ""}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              placeholder="e.g. Dela Cruz"
            />
          </Field>
        </div>

        <Field label="Email *" error={errs.email}>
          <Input
            type="email"
            value={form.email || ""}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@email.com"
          />
        </Field>

        <Field label="Phone *" error={errs.phone}>
          <Input
            value={form.phone || ""}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="e.g. 09123456789"
            maxLength={11}
          />
        </Field>

        <Field label="Role">
          <Select
            value={form.role || "user"}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>

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
{/* ── Responsive ID Preview Modal ───────────────────────────────────────── */}
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
          style={{ borderColor: "#c5d8a0", color: "#4a7020" }}
        >
          ⬇ Download
        </a>
      )}
      <BtnCancel onClick={() => setIdPreview(null)} />
    </div>
  }
>
  {idPreview && (
    <div className="flex justify-center items-center p-4 w-full">
      <div
        className="bg-white rounded-xl shadow-lg flex justify-center items-center"
        style={{
          maxWidth: "95vw",
          maxHeight: "90vh",
          width: "auto",
          height: "auto",
        }}
      >
        {idPreview.isImage ? (
          <img
            src={idPreview.url}
            alt="User ID"
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        ) : (
          <object
            data={idPreview.url}
            type="application/pdf"
            style={{
              width: "100%",
              height: "90vh",
              border: "none",
            }}
          >
            <p className="text-center text-sm p-4" style={{ color: "#7a9060" }}>
              PDF preview unavailable —{" "}
              <a
                href={idPreview.url}
                download
                style={{ color: "#1c4f09", textDecoration: "underline" }}
              >
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