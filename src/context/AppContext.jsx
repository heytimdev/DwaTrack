import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [team,         setTeam]         = useState([]);
  const [stock,        setStock]        = useState([]);
  const [loading,      setLoading]      = useState(false);

  // ── Fetch all data whenever the logged-in user changes ───────────────────────
  useEffect(() => {
    if (!currentUser) {
      // Clear state on logout
      setTransactions([]);
      setProducts([]);
      setExpenses([]);
      setTeam([]);
      setStock([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.get("/transactions").then(setTransactions),
      api.get("/products").then(setProducts),
      api.get("/expenses").then(setExpenses),
      // Only owners have a team list
      currentUser.role === "owner"
        ? api.get("/team").then(setTeam)
        : Promise.resolve(),
      api.get("/stock").then(setStock),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // ── Transactions ─────────────────────────────────────────────────────────────
  async function addTransaction(txData) {
    const newTx = await api.post("/transactions", {
      ...txData,
      firstName: currentUser.firstName,
      lastName:  currentUser.lastName,
    });
    setTransactions((prev) => [newTx, ...prev]);
    // Refresh stock so quantities stay in sync after auto-deduction
    api.get("/stock").then(setStock).catch(() => {});
    return newTx;
  }

  async function deleteTransaction(id) {
    await api.delete(`/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Products ─────────────────────────────────────────────────────────────────
  async function addProduct(productData) {
    const newProd = await api.post("/products", productData);
    setProducts((prev) => [...prev, newProd]);
    return newProd;
  }

  async function updateProduct(id, updates) {
    const updated = await api.put(`/products/${id}`, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deleteProduct(id) {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────
  async function addExpense(expData) {
    const newExp = await api.post("/expenses", {
      ...expData,
      firstName: currentUser.firstName,
      lastName:  currentUser.lastName,
    });
    setExpenses((prev) => [newExp, ...prev]);
    return newExp;
  }

  async function deleteExpense(id) {
    await api.delete(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Team ─────────────────────────────────────────────────────────────────────
  async function addTeamMember(memberData) {
    try {
      const newMember = await api.post("/team", memberData);
      setTeam((prev) => [...prev, newMember]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function removeTeamMember(id) {
    const updated = await api.patch(`/team/${id}/status`);
    setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  // ── Stock ─────────────────────────────────────────────────────────────────────
  async function addStockItem(itemData) {
    const newItem = await api.post("/stock", itemData);
    setStock((prev) => [...prev, newItem]);
    return newItem;
  }

  async function updateStockItem(id, updates) {
    const updated = await api.put(`/stock/${id}`, updates);
    setStock((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  async function deleteStockItem(id) {
    await api.delete(`/stock/${id}`);
    setStock((prev) => prev.filter((s) => s.id !== id));
  }

  async function restockItem(id, addQty) {
    const updated = await api.patch(`/stock/${id}/restock`, { addQty });
    setStock((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  // ── Analytics helpers (pure client-side, no API needed) ──────────────────────
  function getTodaySales() {
    const today = new Date().toDateString();
    return transactions
      .filter((t) => new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }

  function getWeeklyData() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

    return days.map((day, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toDateString();
      const total = transactions
        .filter((t) => new Date(t.createdAt).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.total || 0), 0);
      return { day, total, isToday: date.toDateString() === now.toDateString() };
    });
  }

  function getProductSalesData() {
    const map = {};
    transactions.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        if (!map[item.productName])
          map[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        map[item.productName].qty     += item.qty;
        map[item.productName].revenue += item.price * item.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  return (
    <AppContext.Provider
      value={{
        loading,
        transactions,
        products,
        expenses,
        team,
        stock,
        addTransaction,
        deleteTransaction,
        addProduct,
        updateProduct,
        deleteProduct,
        addExpense,
        deleteExpense,
        addTeamMember,
        removeTeamMember,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        restockItem,
        getTodaySales,
        getWeeklyData,
        getProductSalesData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
