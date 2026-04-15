import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import api from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [team,         setTeam]         = useState([]);
  const [stock,        setStock]        = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [loading,      setLoading]      = useState(false);

  // ── Fetch all data whenever the logged-in user changes ───────────────────────
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setProducts([]);
      setExpenses([]);
      setTeam([]);
      setStock([]);
      setCustomers([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.get("/transactions").then(setTransactions),
      api.get("/products").then(setProducts),
      api.get("/expenses").then(setExpenses),
      currentUser.role === "owner"
        ? api.get("/team").then(setTeam)
        : Promise.resolve(),
      api.get("/stock").then(setStock),
      api.get("/customers").then(setCustomers),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // ── Transactions ─────────────────────────────────────────────────────────────
  async function addTransaction(txData) {
    try {
      const newTx = await api.post("/transactions", {
        ...txData,
        firstName: currentUser.firstName,
        lastName:  currentUser.lastName,
      });
      setTransactions((prev) => [newTx, ...prev]);
      api.get("/stock").then(setStock).catch(() => {});
      toast.success("Sale recorded successfully");
      return newTx;
    } catch (err) {
      toast.error(err.message || "Failed to record sale");
      throw err;
    }
  }

  async function deleteTransaction(id) {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete transaction");
    }
  }

  async function voidTransaction(id, reason) {
    try {
      const updated = await api.patch(`/transactions/${id}/void`, { reason });
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success("Transaction voided");
      return updated;
    } catch (err) {
      toast.error(err.message || "Failed to void transaction");
      throw err;
    }
  }

  // ── Products ─────────────────────────────────────────────────────────────────
  async function addProduct(productData) {
    try {
      const newProd = await api.post("/products", productData);
      setProducts((prev) => [...prev, newProd]);
      toast.success("Product added");
      return newProd;
    } catch (err) {
      toast.error(err.message || "Failed to add product");
    }
  }

  async function updateProduct(id, updates) {
    try {
      const updated = await api.put(`/products/${id}`, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success("Product updated");
    } catch (err) {
      toast.error(err.message || "Failed to update product");
    }
  }

  async function deleteProduct(id) {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────
  async function addExpense(expData) {
    try {
      const newExp = await api.post("/expenses", {
        ...expData,
        firstName: currentUser.firstName,
        lastName:  currentUser.lastName,
      });
      setExpenses((prev) => [newExp, ...prev]);
      toast.success("Expense recorded");
      return newExp;
    } catch (err) {
      toast.error(err.message || "Failed to record expense");
    }
  }

  async function deleteExpense(id) {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete expense");
    }
  }

  // ── Team ─────────────────────────────────────────────────────────────────────
  async function addTeamMember(memberData) {
    try {
      const newMember = await api.post("/team", memberData);
      setTeam((prev) => [...prev, newMember]);
      toast.success("Team member added");
      return { success: true };
    } catch (err) {
      toast.error(err.message || "Failed to add team member");
      return { success: false, error: err.message };
    }
  }

  async function removeTeamMember(id) {
    try {
      const updated = await api.patch(`/team/${id}/status`);
      setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast.success("Team member deactivated");
    } catch (err) {
      toast.error(err.message || "Failed to deactivate team member");
    }
  }

  // ── Stock ─────────────────────────────────────────────────────────────────────
  async function addStockItem(itemData) {
    try {
      const newItem = await api.post("/stock", itemData);
      setStock((prev) => [...prev, newItem]);
      toast.success("Stock item added");
      return newItem;
    } catch (err) {
      toast.error(err.message || "Failed to add stock item");
    }
  }

  async function updateStockItem(id, updates) {
    try {
      const updated = await api.put(`/stock/${id}`, updates);
      setStock((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success("Stock item updated");
    } catch (err) {
      toast.error(err.message || "Failed to update stock item");
    }
  }

  async function deleteStockItem(id) {
    try {
      await api.delete(`/stock/${id}`);
      setStock((prev) => prev.filter((s) => s.id !== id));
      toast.success("Stock item deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete stock item");
    }
  }

  async function restockItem(id, addQty) {
    try {
      const updated = await api.patch(`/stock/${id}/restock`, { addQty });
      setStock((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success("Stock restocked");
    } catch (err) {
      toast.error(err.message || "Failed to restock item");
    }
  }

  // ── Customers ─────────────────────────────────────────────────────────────────
  async function addCustomer(customerData) {
    try {
      const newCustomer = await api.post("/customers", customerData);
      setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      return newCustomer;
    } catch (err) {
      toast.error(err.message || "Failed to add customer");
      throw err;
    }
  }

  // ── Debtors ───────────────────────────────────────────────────────────────────
  // Fetches live debtors summary from the server (not cached in state, called on demand)
  const fetchDebtors = useCallback(async () => {
    return api.get("/debtors");
  }, []);

  const fetchCustomerDebts = useCallback(async (customerId) => {
    return api.get(`/debtors/${customerId}`);
  }, []);

  async function recordDebtPayment(transactionId, amount, note) {
    try {
      const result = await api.post("/debtors/payments", {
        transactionId,
        amount,
        note,
        firstName: currentUser.firstName,
        lastName:  currentUser.lastName,
      });
      // If the debt is now fully paid, remove the credit payment_status from local tx list
      if (result.nowPaid) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId ? { ...t, paymentStatus: "paid" } : t
          )
        );
      }
      toast.success("Payment recorded");
      return result;
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
      throw err;
    }
  }

  // ── Analytics helpers (memoized — only recompute when transactions change) ────
  const getTodaySales = useCallback(() => {
    const today = new Date().toDateString();
    return transactions
      .filter((t) => new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }, [transactions]);

  const getWeeklyData = useCallback(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    return days.map((day, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toDateString();
      const total = transactions
        .filter((t) => new Date(t.createdAt).toDateString() === dateStr)
        .reduce((sum, t) => sum + ((t.total || 0) - (t.taxAmount || 0)), 0);
      return { day, total, isToday: date.toDateString() === now.toDateString() };
    });
  }, [transactions]);

  const getProductSalesData = useCallback(() => {
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
  }, [transactions]);

  return (
    <AppContext.Provider
      value={{
        loading,
        transactions,
        products,
        expenses,
        team,
        stock,
        customers,
        addTransaction,
        deleteTransaction,
        voidTransaction,
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
        addCustomer,
        fetchDebtors,
        fetchCustomerDebts,
        recordDebtPayment,
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
