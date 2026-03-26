// ── PROFILE SETTINGS PANEL ────────────────────────────────────────────────────
import { useState, useRef } from "react";
import { phpApi, PHP_BASE, useToast, Field, Input, Select, Badge, PageHeader, roleBadge } from "../../shared";

export default function ProfilePanel({ user, onUserUpdate }) {
  const [tab,  setTab]  = useState("info");
  const [form, setForm] = useState({ first_name: user.firstName, last_name: user.lastName, email: user.email, phone: "" });
  const [pwForm, setPw] = useState({ current: "", newPass: "", confirm: "" });
  const [errs,  setErrs] = useState({});
  const [photoSrc, setPhoto] = useState(null);
  const [pendingFile, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const { show: toast } = useToast();

  const saveProfile = async () => {
    if (!form.first_name?.trim()) { setErrs({ first_name: "Required" }); return; }
    setSaving(true);
    try {
      const r = await phpApi("update_profile", { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone });
      if (r.success) {
        onUserUpdate({ firstName: r.first_name || form.first_name, lastName: r.last_name || form.last_name, email: r.email || form.email });
        setErrs({}); toast("Profile updated", "success");
      } else { setErrs({ api: r.message }); toast(r.message || "Error", "error"); }
    } catch { setErrs({ api: "Server error" }); toast("Server error", "error"); }
    setSaving(false);
  };

  const changePass = async () => {
    const e = {};
    if (!pwForm.current)                    e.current = "Required";
    if (!pwForm.newPass)                    e.newPass = "Required";
    else if (pwForm.newPass.length < 8)     e.newPass = "Min 8 characters";
    if (pwForm.newPass !== pwForm.confirm)  e.confirm = "Passwords don't match";
    setErrs(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const r = await phpApi("change_password", { current_password: pwForm.current, new_password: pwForm.newPass, confirm_password: pwForm.confirm });
      if (r.success) { setPw({ current: "", newPass: "", confirm: "" }); setErrs({}); toast("Password changed!", "success"); }
      else { setErrs({ api: r.message }); toast(r.message || "Error", "error"); }
    } catch { setErrs({ api: "Server error" }); }
    setSaving(false);
  };

  const previewPhoto = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setPending(f);
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(f);
  };

  const uploadPhoto = async () => {
    if (!pendingFile) return;
    const fd = new FormData();
    fd.append("action", "upload_photo");
    fd.append("photo", pendingFile);
    try {
      const r = await (await fetch(`${PHP_BASE}/admin_dashboard.php`, { method: "POST", body: fd, credentials: "include" })).json();
      if (r.success) { setPending(null); toast("Photo updated!", "success"); }
      else toast("Upload failed", "error");
    } catch { toast("Upload error", "error"); }
  };

  const tabs = [
    { k: "info",     l: "Personal Info", icon: "👤" },
    { k: "photo",    l: "Photo",         icon: "📷" },
    { k: "security", l: "Security",      icon: "🔒" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profile Settings" />

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0" style={{ borderColor: "#ddd0a8" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setErrs({}); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-black border-b-2 transition-all ${
              tab === t.k ? "border-green-600 text-green-700" : "border-transparent hover:text-green-700"
            }`}
            style={{ color: tab === t.k ? "#1c4f09" : "#7a9060" }}>
            <span>{t.icon}</span> {t.l}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {tab === "info" && (
        <div className="rounded-2xl border p-6 max-w-xl flex flex-col gap-4"
          style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
          {errs.api && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">{errs.api}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *" error={errs.first_name}>
              <Input value={form.first_name || ""} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </Field>
            <Field label="Last Name">
              <Input value={form.last_name || ""} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </Field>
          </div>
          <Field label="Email *">
            <Input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+63 900 000 0000" />
          </Field>
          <Field label="Role">
            <Input value={user.role} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </Field>
          <div className="flex justify-end pt-2">
            <button onClick={saveProfile} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
              style={{ background: "#1c4f09" }}>
              {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</> : "💾 Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Photo */}
      {tab === "photo" && (
        <div className="rounded-2xl border p-6 max-w-sm flex flex-col items-center gap-5"
          style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-32 h-32 rounded-full border-4 border-green-200 overflow-hidden flex items-center justify-center text-5xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
              {photoSrc ? <img src={photoSrc} alt="" className="w-full h-full object-cover" /> : "🐾"}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-black">📷 Change</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={previewPhoto} />
          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-50"
              style={{ borderColor: "#ddd0a8", color: "#3a5020" }}>
              📁 Choose File
            </button>
            {pendingFile && (
              <button onClick={uploadPhoto}
                className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
                style={{ background: "#1c4f09" }}>
                ☁ Save Photo
              </button>
            )}
          </div>
          <p className="text-xs font-semibold text-center" style={{ color: "#9aaa80" }}>JPG, PNG, GIF or WebP · Max 2MB</p>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="rounded-2xl border p-6 max-w-xl flex flex-col gap-4"
          style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
          {errs.api && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">{errs.api}</div>}
          <Field label="Current Password *" error={errs.current}>
            <Input type="password" value={pwForm.current} onChange={e => setPw(f => ({ ...f, current: e.target.value }))} placeholder="Enter current password" />
          </Field>
          <Field label="New Password *" error={errs.newPass}>
            <Input type="password" value={pwForm.newPass} onChange={e => setPw(f => ({ ...f, newPass: e.target.value }))} placeholder="Min 8 characters" />
          </Field>
          <Field label="Confirm New Password *" error={errs.confirm}>
            <Input type="password" value={pwForm.confirm} onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
          </Field>
          <div className="flex justify-end pt-2">
            <button onClick={changePass} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
              style={{ background: "#1c4f09" }}>
              {saving ? "Updating…" : "🔑 Update Password"}
            </button>
          </div>
          <div className="border-t pt-4 flex flex-col gap-2" style={{ borderColor: "#e8dfc0" }}>
            <div className="text-xs font-bold" style={{ color: "#9aaa80" }}>Account Info</div>
            <div className="text-sm font-bold" style={{ color: "#1a2e0a" }}>{user.email}</div>
            <Badge color={roleBadge(user.role)}>{user.role}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}