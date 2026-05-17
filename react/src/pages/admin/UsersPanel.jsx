// ── USERS PANEL ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  phpApi, useToast, Modal, Field, Input, Select,
  Badge, Table, Tr, Td, BtnCancel, BtnConfirm,
  PageHeader, SearchBar, roleBadge
} from "../../shared";
import { usePageTitle } from "../../hooks/usePageTitle";
import api from "../../config/axios"; // ← ADDED

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

// ── LOCKED ACCOUNTS PANEL ─────────────────────────────────────────────────────
function LockedAccountsPanel() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [unlocking, setUnlocking] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const DJANGO  = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";
  const token   = localStorage.getItem("pawster_token") || localStorage.getItem("token") || "";
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const fetchLocked = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${DJANGO}/api/admin/login-attempts/locked`, { headers });
      const data = await res.json();
      setAccounts(data.data || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load locked accounts." });
    }
    setLoading(false);
  }, []);

  const unlock = async (email) => {
    setUnlocking(email);
    try {
      const res  = await fetch(`${DJANGO}/api/admin/login-attempts/unlock`, {
        method: "POST", headers, body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `Account unlocked: ${email}` });
        fetchLocked();
      } else {
        setMsg({ type: "error", text: data.message || "Unlock failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error." });
    }
    setUnlocking(null);
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  useEffect(() => { fetchLocked(); }, [fetchLocked]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,252,235,0.92)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1.5px solid rgba(180,140,60,0.22)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(176,48,96,0.12)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b03060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-sm" style={{ color: "#1a4a08" }}>Permanently Locked Accounts</div>
            <div className="text-[0.70rem] font-bold" style={{ color: "#6a7a50" }}>
              {accounts.length} account(s) require admin attention
            </div>
          </div>
        </div>
        <button
          onClick={fetchLocked}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
          style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", color: "#6a7a50" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status message */}
      {msg.text && (
        <div className={`mx-5 mt-3 px-4 py-2 rounded-xl text-xs font-bold ${
          msg.type === "success"
            ? "bg-[rgba(90,170,48,0.12)] text-[#1c4f09] border border-[rgba(90,170,48,0.28)]"
            : "bg-[rgba(192,48,48,0.10)] text-[#c03030] border border-[rgba(192,48,48,0.22)]"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-sm font-bold" style={{ color: "#6a7a50" }}>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Loading...
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6a7a50" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-sm font-bold" style={{ color: "#6a7a50" }}>No permanently locked accounts</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1.5px solid rgba(180,140,60,0.22)" }}>
                {["Email", "Attempts", "Last Attempt", "Status", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[0.70rem] font-black uppercase tracking-wider" style={{ color: "#6a7a50" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a, i) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: i < accounts.length - 1 ? "1px solid rgba(180,140,60,0.13)" : "none" }}
                  className="transition-colors duration-100 hover:bg-[rgba(90,170,48,0.04)]"
                >
                  <td className="px-5 py-3 font-semibold" style={{ color: "#1a4a08" }}>{a.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black" style={{ background: "rgba(176,48,96,0.12)", color: "#b03060" }}>
                      {a.attemptCount}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#6a7a50" }}>
                    {a.lastAttemptAt ? new Date(a.lastAttemptAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black" style={{ background: "rgba(176,48,96,0.12)", color: "#b03060" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Permanently Locked
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => unlock(a.email)}
                      disabled={unlocking === a.email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: "#1c4f09", boxShadow: "0 2px 8px rgba(28,79,9,0.20)" }}
                    >
                      {unlocking === a.email ? (
                        <>
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                          Unlocking...
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                          </svg>
                          Unlock
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
  const [activeTab, setActiveTab] = useState("users");
  const { show: toast }           = useToast();

  usePageTitle("User Management");

  // ── Load users ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await phpApi("get_users", { role: roleFilter === "all" ? "" : roleFilter });
      if (r.success) {
        setUsers((r.data || []).map(u => ({
          ...u,
          zip: u.zip || u.zip_code || "",
        })));
      } else {
        toast(r.message || "Failed to load users", "error");
      }
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
    setForm({ ...u, zip: u.zip || u.zip_code || "" });
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
        // ── Edit — goes through PHP ──────────────────────────────────────
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
          zip:        form.zip || form.zip_code || "",
        });
        if (r.success) {
          toast("User updated", "success");
          setModal(null);
          load();
        } else {
          setErrs({ api: r.message || "Error updating user" });
        }

      } else {
        // ── Add — goes through Spring Boot so email is sent ──────────────
        const r = await api.post("/api/admin/users", {
          firstName: form.first_name,
          lastName:  form.last_name,
          email:     form.email,
          phone:     form.phone,
          role:      form.role,
          address:   form.address  || "",
          city:      form.city     || "",
          province:  form.province || "",
          zip:       form.zip      || "",
        });
        if (r.data?.success) {
          toast("User added successfully!", "success");
          setModal(null);
          load();
        } else {
          setErrs({ api: r.data?.message || "Error adding user" });
        }
      }

    } catch (err) {
      console.error("save user error:", err);
      // Axios throws on non-2xx — extract the message from the response if available
      const message = err?.response?.data?.message || "Server error — check console for details";
      setErrs({ api: message });
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

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          activeTab === "users" ? (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:shadow-lg hover:opacity-90"
              style={{ background: "#1c4f09" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add User
            </button>
          ) : null
        }
      />

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(180,140,60,0.10)", border: "1.5px solid rgba(180,140,60,0.22)" }}>
        {[
          {
            id: "users", label: "All Users",
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )
          },
          {
            id: "locked", label: "Locked Accounts",
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-150 cursor-pointer border-none"
            style={{
              background: activeTab === tab.id ? "#1c4f09"               : "transparent",
              color:      activeTab === tab.id ? "#ffffff"               : "#6a7a50",
              boxShadow:  activeTab === tab.id ? "0 2px 8px rgba(28,79,9,0.20)" : "none",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Locked Accounts Tab ───────────────────────────────────────────── */}
      {activeTab === "locked" && <LockedAccountsPanel />}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end ${activeTab !== "users" ? "hidden" : ""}`}>
        <div className="w-full sm:w-[360px]">
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

      {/* ── Table (desktop) / Cards (mobile) ──────────────────────────────── */}
      {activeTab === "users" && loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : activeTab === "users" && filtered.length === 0 ? (
        <div className="text-center py-16 text-sm font-semibold" style={{ color: "#9aaa80" }}>
          No users found.
        </div>
      ) : activeTab === "users" ? (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block">
            <Table
              headers={["User", "Email", "Phone", "Role", "Status", "ID File", "Joined", "Last Login", "Actions"]}
              empty="No users found.">
              {paged.map(u => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-green-200 overflow-hidden"
                        style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                        {u.photo_name ? (
                          <img src={`/api/users/${u.id}/photo/public`} alt="avatar"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = "none"; }} />
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
                  <Td>
                    {u.id_file_name ? (
                      <button onClick={() => viewId(u)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                        style={{ borderColor: "#c5d8a0", color: "#4a7020" }}>
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
                       <button onClick={() => openEdit(u)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all flex items-center justify-center"
                        style={{ borderColor: "#ddd0a8", color: "#7a9060" }} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => toggleStatus(u)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all flex items-center justify-center"
                        style={{ borderColor: "#ddd0a8", color: "#7a9060" }}
                        title={u.is_active == 1 ? "Deactivate" : "Activate"}>
                        {u.is_active == 1
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                      <button onClick={() => setDel(u)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-black border hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all flex items-center justify-center"
                        style={{ borderColor: "#ddd0a8", color: "#7a9060" }} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {paged.map(u => (
              <div key={u.id}
                className="rounded-2xl border p-4 flex flex-col gap-3"
                style={{ background: "rgba(255,252,232,0.9)", borderColor: "rgba(180,140,60,0.28)" }}>

                {/* Top row: avatar + name + badges */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex-shrink-0 border-2 border-green-200 overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                    {u.photo_name ? (
                      <img src={`/api/users/${u.id}/photo/public`} alt="avatar"
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">
                        {(u.first_name?.[0] || "").toUpperCase()}{(u.last_name?.[0] || "").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm truncate">{u.first_name} {u.last_name}</div>
                    <div className="text-[11px] font-semibold truncate" style={{ color: "#9aaa80" }}>#{u.id} · {u.email}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <Badge color={roleBadge(u.role)}>{u.role}</Badge>
                    <Badge color={u.is_active == 1 ? "green" : "red"}>{u.is_active == 1 ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="font-black uppercase tracking-wide text-[10px]" style={{ color: "#9aaa80" }}>Phone</span>
                    <div className="font-bold" style={{ color: "#3a5020" }}>{u.phone || "—"}</div>
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-wide text-[10px]" style={{ color: "#9aaa80" }}>Joined</span>
                    <div className="font-bold" style={{ color: "#3a5020" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-wide text-[10px]" style={{ color: "#9aaa80" }}>Last Login</span>
                    <div className="font-bold" style={{ color: "#3a5020" }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : <span style={{ color: "#c0b080" }}>Never</span>}
                    </div>
                  </div>
                  <div>
                    <span className="font-black uppercase tracking-wide text-[10px]" style={{ color: "#9aaa80" }}>ID File</span>
                    <div className="mt-0.5">
                      {u.id_file_name ? (
                        <button onClick={() => viewId(u)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border transition-all"
                          style={{ borderColor: "#c5d8a0", color: "#4a7020" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                          View ID
                        </button>
                      ) : (
                        <span style={{ color: "#c0b080" }}>None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "rgba(180,140,60,0.18)" }}>
                  <button onClick={() => openEdit(u)}
                    className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 flex items-center justify-center gap-1.5"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button onClick={() => toggleStatus(u)}
                    className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 flex items-center justify-center gap-1.5"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    {u.is_active == 1
                      ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Deactivate</>
                      : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Activate</>}
                  </button>
                  <button onClick={() => setDel(u)}
                    className="px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 flex items-center justify-center"
                    style={{ borderColor: "#ddd0a8", color: "#7a9060" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
              <p className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(180,140,60,0.28)", color: "#3a5020" }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-8 h-8 rounded-lg text-[11px] font-bold border transition-all"
                    style={{
                      background:   n === page ? "#1a4a08" : "transparent",
                      color:        n === page ? "#fff"    : "#3a5020",
                      borderColor:  n === page ? "#1a4a08" : "rgba(180,140,60,0.28)",
                    }}>
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(180,140,60,0.28)", color: "#3a5020" }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isEdit ? "Edit User" : step === 1 ? "Add New User" : "Add New User — Address"}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
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
              <BtnConfirm onClick={save}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save
              </BtnConfirm>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                A random password will be auto-generated and emailed to the user.
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
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
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
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>}
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
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