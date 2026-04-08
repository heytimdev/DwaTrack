import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut, Clock } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const INACTIVE_MS = 15 * 60 * 1000; // 15 minutes
const WARN_MS     = 60 * 1000;       // 60 seconds to respond

// ── Session Timeout Warning Modal ────────────────────────────────────────────
function SessionWarning({ secondsLeft, onStay, onLogout }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={22} className="text-amber-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-2">
          Still there?
        </h3>
        <p className="text-sm text-gray-500 m-0 mb-1">
          You've been inactive for 15 minutes.
        </p>
        <p className="text-sm text-gray-500 m-0 mb-5">
          You'll be logged out in{" "}
          <span className="font-bold text-amber-500">{secondsLeft}s</span> for security.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer bg-white transition-colors"
          >
            Log out
          </button>
          <button
            onClick={onStay}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const inactiveTimer = useRef(null);
  const countdownTimer = useRef(null);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const resetTimers = useCallback(() => {
    // If warning is showing, don't reset on mouse moves
    if (showWarning) return;

    clearTimeout(inactiveTimer.current);
    clearInterval(countdownTimer.current);

    inactiveTimer.current = setTimeout(() => {
      setSecondsLeft(60);
      setShowWarning(true);

      countdownTimer.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(countdownTimer.current);
            logout();
            navigate("/login");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }, INACTIVE_MS);
  }, [showWarning, logout, navigate]);

  function handleStay() {
    clearInterval(countdownTimer.current);
    setShowWarning(false);
    setSecondsLeft(60);
    resetTimers();
  }

  // Start tracking activity
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers(); // start the initial timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
      clearTimeout(inactiveTimer.current);
      clearInterval(countdownTimer.current);
    };
  }, [resetTimers]);

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
      {showWarning && (
        <SessionWarning
          secondsLeft={secondsLeft}
          onStay={handleStay}
          onLogout={handleLogout}
        />
      )}

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
