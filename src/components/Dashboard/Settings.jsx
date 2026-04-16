import { useState, useRef } from "react";
import { UserPlus, UserX, Shield, User, Briefcase, Save, Camera } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import ktLogo from "../../assets/logo.svg";
import { COUNTRIES, currencyForCountry } from "../../utils/currency";

const ROLE_LABELS = {
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700", icon: Briefcase },
  cashier: { label: "Cashier", color: "bg-amber-100 text-amber-700", icon: User },
};

const ROLE_PERMISSIONS = {
  manager: ["View all transactions", "Add & edit transactions", "Manage expenses", "View reports", "Manage products"],
  cashier: ["Add transactions only", "View own transactions"],
};

export function Settings() {
  const { team, addTeamMember, removeTeamMember } = useApp();
  const { currentUser, canManageTeam, isOwner, updateShopInfo, updateAvatar } = useAuth();

  const [activeTab, setActiveTab] = useState("shop");

  // Shop form
  const [shopForm, setShopForm] = useState({
    businessName: currentUser?.businessName || "",
    city: currentUser?.city || "",
    country: currentUser?.country || "Ghana",
    currency: currentUser?.currency || "GH₵",
    phoneNumber: currentUser?.phoneNumber || "",
    businessEmail: currentUser?.businessEmail || "",
    businessLogo: currentUser?.businessLogo || null,
    taxEnabled: currentUser?.taxEnabled || false,
    taxLabel: currentUser?.taxLabel || "VAT",
    taxRate: currentUser?.taxRate ?? 0,
  });
  const [shopSaved, setShopSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(currentUser?.businessLogo || null);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef(null);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatarPreview(dataUrl);
      setAvatarSaving(true);
      await updateAvatar(dataUrl);
      setAvatarSaving(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveAvatar() {
    setAvatarPreview(null);
    setAvatarSaving(true);
    await updateAvatar(null);
    setAvatarSaving(false);
  }

  // Team form
  const [memberForm, setMemberForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "cashier",
  });
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setShopForm((prev) => ({ ...prev, businessLogo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  }

  function handleShopSave(e) {
    e.preventDefault();
    updateShopInfo(shopForm);
    setShopSaved(true);
    setTimeout(() => setShopSaved(false), 2500);
  }

  function handleAddMember(e) {
    e.preventDefault();
    setTeamError("");
    setTeamSuccess("");
    if (!memberForm.firstName || !memberForm.email || !memberForm.password) {
      setTeamError("First name, email, and password are required.");
      return;
    }
    const result = addTeamMember({ ...memberForm });
    if (result.success) {
      setMemberForm({ firstName: "", lastName: "", email: "", password: "", role: "cashier" });
      setTeamSuccess(`${memberForm.firstName} added successfully.`);
      setTimeout(() => setTeamSuccess(""), 3000);
    } else {
      setTeamError(result.error);
    }
  }

  const tabs = [...(isOwner ? ["shop"] : []), ...(canManageTeam ? ["team"] : []), "account"];

  // Default to first available tab if current tab is no longer visible
  const resolvedTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800 m-0">Settings</h2>
        <p className="text-sm text-gray-500 m-0">Manage your shop, team, and account.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer transition-colors capitalize
              ${resolvedTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Shop settings */}
      {resolvedTab === "shop" && isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-5">Shop Information</h3>
          <form onSubmit={handleShopSave} className="space-y-5">

            {/* Logo upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                    : <img src={ktLogo} alt="logo" className="w-8 h-8 opacity-40" />
                  }
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera size={12} className="text-white" />
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 m-0">Business Logo</p>
                <p className="text-xs text-gray-400 m-0 mt-0.5">Shown on receipts. Click the camera to update.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Business name</label>
                <input
                  type="text"
                  value={shopForm.businessName}
                  onChange={(e) => setShopForm({ ...shopForm, businessName: e.target.value })}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">City / Address</label>
                <input
                  type="text"
                  value={shopForm.city}
                  onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Country & currency</label>
                <select
                  value={shopForm.country}
                  onChange={(e) => {
                    const country = e.target.value;
                    setShopForm({ ...shopForm, country, currency: currencyForCountry(country) });
                  }}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={shopForm.phoneNumber}
                  onChange={(e) => setShopForm({ ...shopForm, phoneNumber: e.target.value })}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Business email</label>
                <input
                  type="email"
                  value={shopForm.businessEmail}
                  onChange={(e) => setShopForm({ ...shopForm, businessEmail: e.target.value })}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
            </div>
            {/* Tax configuration */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 m-0">Tax Configuration</p>
                  <p className="text-xs text-gray-400 m-0 mt-0.5">Applies as a line item on every receipt.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shopForm.taxEnabled}
                    onChange={(e) => setShopForm({ ...shopForm, taxEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
              {shopForm.taxEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tax label</label>
                    <input
                      type="text"
                      value={shopForm.taxLabel}
                      onChange={(e) => setShopForm({ ...shopForm, taxLabel: e.target.value })}
                      placeholder="e.g. VAT, NHIL, Tax"
                      className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={shopForm.taxRate}
                      onChange={(e) => setShopForm({ ...shopForm, taxRate: e.target.value })}
                      placeholder="e.g. 12.5"
                      className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
            >
              <Save size={15} /> {shopSaved ? "Saved!" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Team management */}
      {resolvedTab === "team" && canManageTeam && (
        <div className="space-y-5">
          {/* Add member form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-teal-500" />
              <h3 className="text-sm font-semibold text-gray-800 m-0">Add Team Member</h3>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              {teamError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{teamError}</p>}
              {teamSuccess && <p className="text-xs text-teal-700 bg-teal-50 px-3 py-2 rounded-lg m-0">{teamSuccess}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
                  <input
                    type="text"
                    value={memberForm.firstName}
                    onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
                  <input
                    type="text"
                    value={memberForm.lastName}
                    onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="john@shop.com"
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={memberForm.password}
                    onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["cashier", "manager"].map((role) => {
                    const { label, icon: Icon } = ROLE_LABELS[role];
                    const perms = ROLE_PERMISSIONS[role];
                    return (
                      <label
                        key={role}
                        className={`border-2 rounded-xl p-3 cursor-pointer transition-colors ${memberForm.role === role ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={memberForm.role === role}
                          onChange={() => setMemberForm({ ...memberForm, role })}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={15} className={memberForm.role === role ? "text-teal-600" : "text-gray-400"} />
                          <span className={`text-sm font-semibold ${memberForm.role === role ? "text-teal-700" : "text-gray-700"}`}>{label}</span>
                        </div>
                        <ul className="m-0 p-0 list-none space-y-0.5">
                          {perms.map((p, i) => (
                            <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
              >
                <UserPlus size={15} /> Add Member
              </button>
            </form>
          </div>

          {/* Team list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 m-0">Team Members ({team.filter((m) => m.status === "active").length})</h3>
            </div>
            {team.filter((m) => m.status === "active").length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Shield size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm m-0">No team members yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {team.filter((m) => m.status === "active").map((member) => {
                  const roleInfo = ROLE_LABELS[member.role];
                  const RoleIcon = roleInfo?.icon || User;
                  return (
                    <div key={member.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm m-0 truncate">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-gray-400 m-0 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${roleInfo?.color || "bg-gray-100 text-gray-600"}`}>
                          <RoleIcon size={11} />
                          {roleInfo?.label || member.role}
                        </span>
                        <button
                          onClick={() => removeTeamMember(member.id)}
                          title="Remove member"
                          className="text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account tab */}
      {resolvedTab === "account" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-sm font-semibold text-gray-800 m-0">Account Information</h3>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center border-2 border-gray-200">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-teal-600 select-none">
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </span>
                }
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center cursor-pointer shadow transition-colors">
                <Camera size={13} className="text-white" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 m-0">{currentUser?.firstName} {currentUser?.lastName}</p>
              <p className="text-xs text-gray-400 m-0 mt-0.5 capitalize">{currentUser?.role} · {currentUser?.businessName}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium border-none bg-transparent cursor-pointer p-0 disabled:opacity-50"
                >
                  {avatarSaving ? "Saving…" : "Change photo"}
                </button>
                {avatarPreview && (
                  <>
                    <span className="text-gray-300 text-xs">·</span>
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarSaving}
                      className="text-xs text-red-400 hover:text-red-500 font-medium border-none bg-transparent cursor-pointer p-0 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50 gap-4">
              <span className="text-xs text-gray-500 shrink-0">Name</span>
              <span className="text-sm font-medium text-gray-800 text-right">{currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 gap-4">
              <span className="text-xs text-gray-500 shrink-0">Email</span>
              <span className="text-sm text-gray-800 text-right truncate">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 gap-4">
              <span className="text-xs text-gray-500 shrink-0">Role</span>
              <span className="text-sm font-medium text-gray-800 capitalize">{currentUser?.role}</span>
            </div>
            <div className="flex items-center justify-between py-2 gap-4">
              <span className="text-xs text-gray-500 shrink-0">Shop</span>
              <span className="text-sm text-gray-800 text-right truncate">{currentUser?.businessName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
