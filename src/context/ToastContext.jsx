import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const toast = {
    success: (msg)  => add("success", msg),
    error:   (msg)  => add("error",   msg),
    info:    (msg)  => add("info",    msg),
    warning: (msg)  => add("warning", msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ── Toast Container ────────────────────────────────────────────────────────────
const ICONS = {
  success: "✓",
  error:   "✕",
  info:    "i",
  warning: "!",
};

const STYLES = {
  success: { bar: "#10b981", icon: "#10b981", bg: "#f0fdf4", text: "#065f46" },
  error:   { bar: "#ef4444", icon: "#ef4444", bg: "#fef2f2", text: "#7f1d1d" },
  info:    { bar: "#3b82f6", icon: "#3b82f6", bg: "#eff6ff", text: "#1e3a8a" },
  warning: { bar: "#f59e0b", icon: "#f59e0b", bg: "#fffbeb", text: "#78350f" },
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      maxWidth: 360,
      width: "calc(100vw - 40px)",
    }}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.info;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      background: s.bg,
      border: `1px solid ${s.bar}22`,
      borderLeft: `4px solid ${s.bar}`,
      borderRadius: 10,
      padding: "12px 14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
      animation: "toastIn 0.25s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      {/* Icon */}
      <span style={{
        width: 22, height: 22,
        borderRadius: "50%",
        background: s.bar,
        color: "white",
        fontSize: 12,
        fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        {ICONS[toast.type]}
      </span>

      {/* Message */}
      <p style={{
        margin: 0, flex: 1,
        fontSize: 13.5,
        fontWeight: 500,
        color: s.text,
        lineHeight: 1.5,
        fontFamily: "Poppins, sans-serif",
      }}>
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: s.text, opacity: 0.5, fontSize: 16,
          padding: 0, lineHeight: 1, flexShrink: 0,
        }}
      >×</button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
