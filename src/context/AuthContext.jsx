import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("kobotrack_user");
    return saved ? JSON.parse(saved) : null;
  });

  function signup(formData) {
    const users = JSON.parse(localStorage.getItem("kobotrack_users") || "[]");
    const emailNorm = (formData.email || "").trim().toLowerCase();

    if (users.find((u) => u.email === emailNorm && u.role === "owner")) {
      return { success: false, error: "Email already exists" };
    }
    const newUser = {
      id: Date.now().toString(),
      businessName: formData.businessName,
      businessEmail: formData.businessEmail,
      phoneNumber: formData.phoneNumber,
      city: formData.city,
      businessLogo: formData.businessLogo || "",
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: emailNorm,
      password: formData.password,
      role: "owner",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem("kobotrack_users", JSON.stringify(users));

    // Init team list for this owner
    const teamKey = `kobotrack_team_${newUser.id}`;
    if (!localStorage.getItem(teamKey)) {
      localStorage.setItem(teamKey, JSON.stringify([]));
    }

    const { password, ...userWithoutPassword } = newUser;
    setCurrentUser(userWithoutPassword);
    localStorage.setItem("kobotrack_user", JSON.stringify(userWithoutPassword));
    return { success: true };
  }

  function login(email, password) {
    const emailNorm = (email || "").trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem("kobotrack_users") || "[]");

    // Check owner accounts only (role === "owner")
    const ownerUsers = users.filter((u) => u.role === "owner");
    const user = ownerUsers.find(
      (u) => u.email === emailNorm && u.password === password
    );
    if (user) {
      const { password: _p, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem("kobotrack_user", JSON.stringify(userWithoutPassword));
      return { success: true };
    }

    // Check team members — search every owner's team list
    for (const owner of ownerUsers) {
      const teamKey = `kobotrack_team_${owner.id}`;
      const team = JSON.parse(localStorage.getItem(teamKey) || "[]");
      const member = team.find(
        (m) =>
          (m.email || "").trim().toLowerCase() === emailNorm &&
          m.password === password &&
          m.status === "active"
      );
      if (member) {
        const memberUser = {
          ...member,
          businessName: owner.businessName,
          businessEmail: owner.businessEmail,
          businessLogo: owner.businessLogo,
          city: owner.city,
          phoneNumber: owner.phoneNumber,
          ownerId: owner.id,
        };
        const { password: _p, ...memberWithoutPassword } = memberUser;
        setCurrentUser(memberWithoutPassword);
        localStorage.setItem("kobotrack_user", JSON.stringify(memberWithoutPassword));
        return { success: true };
      }
    }

    return { success: false, error: "Invalid email or password" };
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("kobotrack_user");
  }

  function updateShopInfo(updates) {
    const users = JSON.parse(localStorage.getItem("kobotrack_users") || "[]");
    const userId = currentUser.ownerId || currentUser.id;
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      // Preserve password — only spread non-sensitive updates
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem("kobotrack_users", JSON.stringify(users));
    }
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem("kobotrack_user", JSON.stringify(updated));
  }

  const isOwner = currentUser?.role === "owner";
  const isManager = currentUser?.role === "manager";
  const isCashier = currentUser?.role === "cashier";

  const canManageTeam = isOwner;
  const canManageProducts = isOwner || isManager;
  const canViewReports = isOwner || isManager;
  const canAddTransactions = isOwner || isManager || isCashier;
  const canDeleteTransactions = isOwner;
  const canManageExpenses = isOwner || isManager;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
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
