// ── USERS PANEL ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, roleBadge
} from "../../shared";

export default function UsersPanel({ show }) {
  const [users,      setUsers]    = useState([]);
  const [loading,    setLoading]  = useState(false);
  const [search,     setSearch]   = useState("");
  const [roleFilter, setRole]     = useState("all");
  const [modal,      setModal]    = useState(null);
  const [form,       setForm]     = useState({});
  const [delModal,   setDel]      = useState(null);
  const [errs,       setErrs]     = useState({});
  const { show: toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await phpApi("get_users", { role: roleFilter === "all" ? "" : roleFilter });
      if (r.success) setUsers(r.data || []);
    } catch {}
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { if (show) load(); }, [show, load]);

  const save = async () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = "Required";
    if (!form.last_name?.trim())  e.last_name  = "Required";
    if (!form.email?.trim())      e.email      = "Required";
    if (!form.id && !form.password) e.password = "Required for new users";
    setErrs(e);
    if (Object.keys(e).length) return;

    try {
      const r = await phpApi(form.id ? "update_user" : "add_user", { ...form, is_active: form.is_active ?? 1 });
      if (r.success) { toast(form.id ? "User updated" : "User added", "success"); setModal(null); load(); }
      else setErrs({ api: r.message || "Error saving" });
    } catch { setErrs({ api: "Server error" }); }
  };

  const del = async () => {
    try {
      await phpApi("delete", { type: "user", id: delModal.id });
      toast("User deleted", "success");
      setDel(null); load();
    } catch { toast("Error deleting", "error"); }
  };

  const toggleStatus = async (u) => {
    await phpApi("update_user_status", { id: u.id, is_active: u.is_active == 1 ? 0 : 1 });
    toast(`User ${u.is_active == 1 ? "deactivated" : "activated"}`, "info");
    load();
  };

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="User Management"
        subtitle="Manage all registered accounts"
        action={
          <button
            onClick={() => { setForm({ role: "user", is_active: 1 }); setErrs({}); setModal("add"); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
            style={{ background: "#1c4f09" }}>
            + Add User
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
        <div className="flex gap-1.5">
          {[
            { key: "all",   label: "All Roles" },
            { key: "admin", label: "Admin"     },
            { key: "user",  label: "User"      },
          ].map(t => (
            <button key={t.key} onClick={() => setRole(t.key)}
              className={`px-3 py-2.5 rounded-xl text-xs font-black border transition-all ${
                roleFilter === t.key
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Table
          headers={["User", "Email", "Role", "Status", "Joined", "Last Login", "Actions"]}
          empty="No users found.">
          {filtered.map(u => (
            <Tr key={u.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 border-2 border-green-200"
                    style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                    {(u.first_name?.[0] || "").toUpperCase()}{(u.last_name?.[0] || "").toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm">{u.first_name} {u.last_name}</div>
                    <div className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>#{u.id}</div>
                  </div>
                </div>
              </Td>
              <Td>{u.email}</Td>
              <Td><Badge color={roleBadge(u.role)}>{u.role}</Badge></Td>
              <Td><Badge color={u.is_active == 1 ? "green" : "red"}>{u.is_active == 1 ? "Active" : "Inactive"}</Badge></Td>
              <Td className="text-xs whitespace-nowrap">
                {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </Td>
              <Td className="text-xs">
                {u.last_login
                  ? new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : <span style={{ color: "#c0b080" }}>Never</span>
                }
              </Td>
              <Td>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setForm({ ...u, password: "" }); setErrs({}); setModal("edit"); }}
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

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit User" : "Add New User"}
        icon="👤"
        footer={
          <>
            <BtnCancel onClick={() => setModal(null)} />
            <BtnConfirm onClick={save}>💾 Save</BtnConfirm>
          </>
        }>
        {errs.api && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">{errs.api}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name *" error={errs.first_name}>
            <Input value={form.first_name || ""} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          </Field>
          <Field label="Last Name *" error={errs.last_name}>
            <Input value={form.last_name || ""} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          </Field>
        </div>
        <Field label="Email *" error={errs.email}>
          <Input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={modal === "edit" ? "New Password (blank = keep)" : "Password *"} error={errs.password}>
            <Input type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          </Field>
          <Field label="Role">
            <Select value={form.role || "user"} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </div>
        <Field label="Status">
          <Select value={String(form.is_active ?? 1)} onChange={e => setForm(f => ({ ...f, is_active: e.target.value }))}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
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
            <BtnConfirm onClick={del} red>Delete User</BtnConfirm>
          </>
        }>
        <p className="text-sm font-semibold" style={{ color: "#3a5020" }}>
          Delete <strong className="font-black">{delModal?.first_name} {delModal?.last_name}</strong>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}