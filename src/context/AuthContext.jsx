import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  // true while we're verifying the stored token on first load
  const [authLoading, setAuthLoading] = useState(true);

  // ── Restore session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("kobotrack_token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((user) => setCurrentUser(user))
      .catch(() => localStorage.removeItem("kobotrack_token"))
      .finally(() => setAuthLoading(false));
  }, []);

  // ── signup ───────────────────────────────────────────────────────────────────
  async function signup(formData) {
    try {
      const { token, user } = await api.post("/auth/signup", {
        businessName:  formData.businessName,
        businessEmail: formData.businessEmail,
        phoneNumber:   formData.phoneNumber,
        city:          formData.city,
        businessLogo:  formData.businessLogo || "",
        firstName:     formData.firstName,
        lastName:      formData.lastName,
        email:         formData.email,
        password:      formData.password,
      });
      localStorage.setItem("kobotrack_token", token);
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── login ────────────────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const { token, user } = await api.post("/auth/login", { email, password });
      localStorage.setItem("kobotrack_token", token);
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── logout ───────────────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem("kobotrack_token");
    setCurrentUser(null);
  }

  // ── updateShopInfo ───────────────────────────────────────────────────────────
  async function updateShopInfo(updates) {
    try {
      const updatedUser = await api.put("/settings/shop", updates);
      setCurrentUser(updatedUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Role & permission flags (derived, never stored) ──────────────────────────
  const isOwner   = currentUser?.role === "owner";
  const isManager = currentUser?.role === "manager";
  const isCashier = currentUser?.role === "cashier";

  const canManageTeam         = isOwner;
  const canManageProducts     = isOwner || isManager;
  const canViewReports        = isOwner || isManager;
  const canAddTransactions    = isOwner || isManager || isCashier;
  const canDeleteTransactions = isOwner;
  const canManageExpenses     = isOwner || isManager;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        login,
        signup,
        logout,
        updateShopInfo,
        isOwner,
        isManager,
        isCashier,
        canManageTeam,
        canManageProducts,
        canViewReports,
        canAddTransactions,
        canDeleteTransactions,
        canManageExpenses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
