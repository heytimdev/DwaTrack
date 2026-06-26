import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import { SignUp } from "./components/Login/Signup.jsx";
import { Home } from "./components/Body/Home.jsx";
import { Login } from "./components/Login/Login.jsx";
import { ForgotPassword } from "./components/Login/ForgotPassword.jsx";
import { ResetPassword } from "./components/Login/ResetPassword.jsx";
import { DashboardLayout } from "./components/Dashboard/DashboardLayout.jsx";
import { DashboardHome } from "./components/Dashboard/DashboardHome.jsx";
import { Transactions } from "./components/Dashboard/Transactions.jsx";
import { Expenses } from "./components/Dashboard/Expenses.jsx";
import { Reports } from "./components/Dashboard/Reports.jsx";
import { Analysis } from "./components/Dashboard/Analysis.jsx";
import { Settings } from "./components/Dashboard/Settings.jsx";
import { Stock } from "./components/Dashboard/Stock.jsx";
import { AIAssistant } from "./components/Dashboard/AIAssistant.jsx";
import { AuditLog } from "./components/Dashboard/AuditLog.jsx";
import { Debtors } from "./components/Dashboard/Debtors.jsx";
import AdminLogin from "./components/Admin/AdminLogin.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";

function AdminRoute({ children }) {
  const token = localStorage.getItem('dwatrack_admin_token');
  if (!token) return <Navigate to="/admin" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #d1fae5", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

// Redirects to /dashboard if the user lacks the required permission flag.
function RoleRoute({ children, perm }) {
  const auth = useAuth();
  if (!auth[perm]) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin panel */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout />
            </AppProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="expenses"  element={<RoleRoute perm="canManageExpenses"><Expenses /></RoleRoute>} />
        <Route path="stock"     element={<RoleRoute perm="canManageStock"><Stock /></RoleRoute>} />
        <Route path="debtors"   element={<RoleRoute perm="canManageDebtors"><Debtors /></RoleRoute>} />
        <Route path="reports"   element={<RoleRoute perm="canViewReports"><Reports /></RoleRoute>} />
        <Route path="analysis"  element={<RoleRoute perm="canViewAnalysis"><Analysis /></RoleRoute>} />
        <Route path="settings"  element={<Settings />} />
        <Route path="ai"        element={<RoleRoute perm="canUseAI"><AIAssistant /></RoleRoute>} />
        <Route path="audit"     element={<RoleRoute perm="canManageTeam"><AuditLog /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
