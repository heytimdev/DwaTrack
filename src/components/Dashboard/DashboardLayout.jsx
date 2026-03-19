import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 border-none bg-transparent cursor-pointer"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 m-0 truncate">
              {greeting()}, {currentUser?.firstName}
            </h1>
            <p className="text-xs text-gray-500 m-0">{today}</p>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-56">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-sm text-gray-600 w-full"
              placeholder="Search transactions..."
            />
          </div>

          <button className="relative text-gray-500 hover:text-gray-700 border-none bg-transparent cursor-pointer">
            <Bell size={20} />
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-500 border-none bg-transparent cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
