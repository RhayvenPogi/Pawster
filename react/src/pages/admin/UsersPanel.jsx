// ── USERS PANEL ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, roleBadge
} from "../../shared";

export default function UsersPanel({ show }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [delModal, setDel] = useState(null);
  const [errs, setErrs] = useState({});
  const { show: toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await phpApi("get_users", { role: roleFilter === "all" ? "" : roleFilter });
      if (r.success) setUsers(r.data || []);
    } catch { }
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { if (show) load(); }, [show, load]);

  const save = async () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = "Required";
    if (!form.last_name?.trim()) e.last_name = "Required";
    if (!form.email?.trim()) e.email = "Required";

    // Password validation — only required for new users
    if (!form.id) {
      if (!form.password) {
        e.password = "Required for new users";
      } else if (form.password.length < 8) {
        e.password = "Must be at least 8 characters";
      }
      if (!form.confirm_password) {
        e.confirm_password = "Please confirm the password";
      } else if (form.password && form.password !== form.confirm_password) {
        e.confirm_password = "Passwords do not match";
      }
    } else {
      // Edit mode — only validate if they typed something
      if (form.password) {
        if (form.password.length < 8) {
          e.password = "Must be at least 8 characters";
        }
        if (!form.confirm_password) {
          e.confirm_password = "Please confirm the new password";
        } else if (form.password !== form.confirm_password) {
          e.confirm_password = "Passwords do not match";
        }
      }
    }

    setErrs(e);
    if (Object.keys(e).length) return;

    try {
      // Strip confirm_password before sending to API
      const { confirm_password, ...payload } = form.id
        ? form
        : { ...form, is_active: 1 };

      const r = await phpApi(form.id ? "update_user" : "add_user", payload);
      if (r.success) {
        toast(form.id ? "User updated" : "User added", "success");
        setModal(null);
        load();
      } else {
        setErrs({ api: r.message || "Error saving" });
      }
    } catch {
      setErrs({ api: "Server error" });
    }
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

  const isAdd = modal === "add";
  const isEdit = modal === "edit";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="User Management"
        subtitle="Manage all registered accounts"
        action={
          <button
            onClick={() => {
              setForm({ role: "user", is_active: 1 });
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
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search users…"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span style={{ color: "#1c4f09" }}>Role:</span>
          <Select
            value={roleFilter}
            onChange={(e) => setRole(e.target.value)}
            className="w-36"
          >
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
          headers={["User", "Email", "Role", "Status", "Joined", "Last Login", "Actions"]}
          empty="No users found.">
          {filtered.map(u => (
            <Tr key={u.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 border-2 border-green-200"
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
                    onClick={() => { setForm({ ...u, password: "", confirm_password: "" }); setErrs({}); setModal("edit"); }}
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

        {/* Name row */}
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

        {/* Email */}
        <Field label="Email *" error={errs.email}>
          <Input
            type="email"
            value={form.email || ""}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="example@email.com"
          />
        </Field>

        {/* Password row — full width for add, paired for edit */}
        {isAdd ? (
          // ADD MODE: Password + Confirm Password side-by-side
          <div className="grid grid-cols-2 gap-3">
            <Field label="Password *" error={errs.password}>
              <Input
                type="password"
                value={form.password || ""}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm Password *" error={errs.confirm_password}>
              <Input
                type="password"
                value={form.confirm_password || ""}
                onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          </div>
        ) : (
          // EDIT MODE: Optional new password + confirm, only shown together
          <div className="grid grid-cols-2 gap-3">
            <Field label="New Password (blank = keep)" error={errs.password}>
              <Input
                type="password"
                value={form.password || ""}
                onChange={e => setForm(f => ({ ...f, password: e.target.value, confirm_password: "" }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm New Password"
              error={errs.confirm_password}
            >
              <Input
                type="password"
                value={form.confirm_password || ""}
                onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={!form.password}
                style={{ opacity: form.password ? 1 : 0.45, cursor: form.password ? "text" : "not-allowed" }}
              />
            </Field>
          </div>
        )}

        {/* Role row */}
        <Field label="Role">
          <Select
            value={form.role || "user"}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>

        {/* Password strength hint — only on add */}
        {isAdd && form.password && (
          <PasswordStrength password={form.password} />
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
    </div>
  );
}

// ── PASSWORD STRENGTH INDICATOR ───────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const passed = checks.filter(c => c.pass).length;
  const strength = passed <= 2 ? "Weak" : passed <= 3 ? "Fair" : passed === 4 ? "Good" : "Strong";
  const strengthColor = passed <= 2 ? "#e05c3a" : passed <= 3 ? "#d4900a" : passed === 4 ? "#4a8f3f" : "#1c7c2a";
  const barColor = passed <= 2 ? "#f4a090" : passed <= 3 ? "#f4c870" : passed === 4 ? "#82c474" : "#3ab54a";

  return (
    <div
      className="rounded-xl px-3 py-2.5 flex flex-col gap-2"
      style={{ background: "rgba(42,112,16,0.04)", border: "1px solid rgba(42,112,16,0.1)" }}>

      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= passed ? barColor : "#e0d8c0" }}
            />
          ))}
        </div>
        <span className="text-[11px] font-black" style={{ color: strengthColor, minWidth: 44 }}>
          {strength}
        </span>
      </div>

      {/* Check list */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map(c => (
          <span
            key={c.label}
            className="text-[11px] font-bold flex items-center gap-1"
            style={{ color: c.pass ? "#3a7010" : "#a09060" }}>
            <span style={{ fontSize: 10 }}>{c.pass ? "✓" : "○"}</span>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}