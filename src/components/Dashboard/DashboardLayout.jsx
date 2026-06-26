import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, Bell, Search, LogOut, Clock, Download, X, AlertTriangle, CreditCard, Package } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

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

// ── PWA Install Banner ────────────────────────────────────────────────────────
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shrink-0">
          <Download size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold m-0">Install DwaTrack</p>
          <p className="text-xs text-gray-400 m-0">Works offline, loads instantly</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer shrink-0"
        >
          Install
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell({ stock, transactions, currency, canManageStock, canManageDebtors }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = useMemo(() => {
    const items = [];

    // Low / out-of-stock alerts — only shown to users who can access the stock page
    if (canManageStock) {
      (stock || []).forEach((s) => {
        if (s.quantity === 0) {
          items.push({ id: `stock-out-${s.id}`, type: "out", icon: Package, label: `${s.name} is out of stock`, link: "/dashboard/stock" });
        } else if (s.quantity <= s.lowStockThreshold) {
          items.push({ id: `stock-low-${s.id}`, type: "low", icon: AlertTriangle, label: `${s.name} is running low (${s.quantity} left)`, link: "/dashboard/stock" });
        }
      });
    }

    // Unpaid credit / partial transactions — only shown to users who can access debtors
    if (canManageDebtors) {
      const unpaid = (transactions || []).filter(
        (t) => t.paymentStatus === "credit" || t.paymentStatus === "partial"
      );
      if (unpaid.length > 0) {
        const total = unpaid.reduce((s, t) => s + ((t.total || 0) - (t.amountPaid || 0)), 0);
        items.push({
          id: "unpaid",
          type: "credit",
          icon: CreditCard,
          label: `${unpaid.length} unpaid sale${unpaid.length !== 1 ? "s" : ""} — ${currency}${total.toFixed(2)} outstanding`,
          link: "/dashboard/debtors",
        });
      }
    }

    return items;
  }, [stock, transactions, currency, canManageStock, canManageDebtors]);

  const count = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-gray-500 hover:text-gray-700 border-none bg-transparent cursor-pointer p-1"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 m-0">Notifications</p>
            {count > 0 && (
              <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{count} new</span>
            )}
          </div>

          {count === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm m-0">All clear — no alerts right now</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 no-underline transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === "out" ? "bg-red-100" :
                    n.type === "low" ? "bg-amber-100" :
                    "bg-blue-100"
                  }`}>
                    <n.icon size={15} className={
                      n.type === "out" ? "text-red-500" :
                      n.type === "low" ? "text-amber-500" :
                      "text-blue-500"
                    } />
                  </div>
                  <p className="text-sm text-gray-700 m-0 leading-snug">{n.label}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const [searchQuery, setSearchQuery] = useState("");

  const { currentUser, logout, canManageStock, canManageDebtors } = useAuth();
  const { stock, transactions } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const inactiveTimer   = useRef(null);
  const countdownTimer  = useRef(null);
  const showWarningRef  = useRef(false); // ref mirror so resetTimers never stales
  const warningShownAt  = useRef(null);  // wall-clock timestamp when warning appeared
  const lastActivityRef = useRef(Date.now());

  // Keep ref in sync with state
  useEffect(() => { showWarningRef.current = showWarning; }, [showWarning]);

  const doLogout = useCallback(() => {
    clearTimeout(inactiveTimer.current);
    clearInterval(countdownTimer.current);
    warningShownAt.current = null;
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    // Don't reset the inactivity timer while the warning is visible
    if (showWarningRef.current) return;

    lastActivityRef.current = Date.now();
    clearTimeout(inactiveTimer.current);

    inactiveTimer.current = setTimeout(() => {
      warningShownAt.current = Date.now();
      setSecondsLeft(WARN_MS / 1000);
      setShowWarning(true);
      showWarningRef.current = true;

      // Poll at 500 ms using wall-clock time — accurate even in throttled background tabs
      countdownTimer.current = setInterval(() => {
        const elapsed  = Date.now() - warningShownAt.current;
        const remaining = Math.ceil((WARN_MS - elapsed) / 1000);
        if (remaining <= 0) {
          doLogout();
        } else {
          setSecondsLeft(remaining);
        }
      }, 500);
    }, INACTIVE_MS);
  }, [doLogout]); // no showWarning dependency — uses ref instead

  // Page Visibility API: force-logout the moment the tab regains focus
  // if either the full timeout or the warning period has already expired.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();

      // Warning was shown and the 60-second grace period has passed
      if (warningShownAt.current && now - warningShownAt.current >= WARN_MS) {
        doLogout();
        return;
      }

      // Warning not yet shown but the inactivity period has already elapsed
      if (!showWarningRef.current && now - lastActivityRef.current >= INACTIVE_MS) {
        warningShownAt.current = now;
        setSecondsLeft(WARN_MS / 1000);
        setShowWarning(true);
        showWarningRef.current = true;

        countdownTimer.current = setInterval(() => {
          const elapsed   = Date.now() - warningShownAt.current;
          const remaining = Math.ceil((WARN_MS - elapsed) / 1000);
          if (remaining <= 0) {
            doLogout();
          } else {
            setSecondsLeft(remaining);
          }
        }, 500);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [doLogout]);

  // Clear search input when navigating away from transactions
  useEffect(() => {
    if (!location.pathname.includes("/transactions")) {
      setSearchQuery("");
    }
  }, [location.pathname]);

  function handleSearch(e) {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate("/dashboard/transactions", { state: { search: searchQuery.trim() } });
    }
  }

  function handleStay() {
    clearInterval(countdownTimer.current);
    warningShownAt.current = null;
    setShowWarning(false);
    showWarningRef.current = false;
    setSecondsLeft(WARN_MS / 1000);
    resetTimers();
  }

  // Start tracking activity — only runs once on mount
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
      <InstallBanner />
      {showWarning && (
        <SessionWarning
          secondsLeft={secondsLeft}
          onStay={handleStay}
          onLogout={doLogout}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0 shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <NotificationBell
            stock={stock}
            transactions={transactions}
            currency={currentUser?.currency || "GH₵"}
            canManageStock={canManageStock}
            canManageDebtors={canManageDebtors}
          />

          <button
            onClick={doLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-500 border-none bg-transparent cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
