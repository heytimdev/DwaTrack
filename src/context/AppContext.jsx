import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

function getOwnerKey(user) {
  return user?.ownerId || user?.id;
}

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  });

  function set(newValue) {
    const val = typeof newValue === "function" ? newValue(value) : newValue;
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  }

  return [value, set];
}

function generateReceiptNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${y}${m}${d}-${rand}`;
}

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const ownerId = getOwnerKey(currentUser);

  const txKey = ownerId ? `kobotrack_transactions_${ownerId}` : null;
  const prodKey = ownerId ? `kobotrack_products_${ownerId}` : null;
  const expKey = ownerId ? `kobotrack_expenses_${ownerId}` : null;
  const teamKey = ownerId ? `kobotrack_team_${ownerId}` : null;
  const stockKey = ownerId ? `kobotrack_stock_${ownerId}` : null;

  const [transactions, setTransactionsRaw] = useState([]);
  const [products, setProductsRaw] = useState([]);
  const [expenses, setExpensesRaw] = useState([]);
  const [team, setTeamRaw] = useState([]);
  const [stock, setStockRaw] = useState([]);

  useEffect(() => {
    if (!ownerId) return;
    setTransactionsRaw(JSON.parse(localStorage.getItem(txKey) || "[]"));
    setProductsRaw(JSON.parse(localStorage.getItem(prodKey) || "[]"));
    setExpensesRaw(JSON.parse(localStorage.getItem(expKey) || "[]"));
    setTeamRaw(JSON.parse(localStorage.getItem(teamKey) || "[]"));
    setStockRaw(JSON.parse(localStorage.getItem(stockKey) || "[]"));
  }, [ownerId]);

  function persist(key, setter, value) {
    setter(value);
    if (key) localStorage.setItem(key, JSON.stringify(value));
  }

  // Transactions
  function addTransaction(txData) {
    const newTx = {
      id: Date.now().toString(),
      receiptNumber: generateReceiptNumber(),
      date: new Date().toLocaleDateString("en-GH", { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
      time: new Date().toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" }),
      addedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      ...txData,
    };
    const updated = [newTx, ...transactions];
    persist(txKey, setTransactionsRaw, updated);

    // Auto-deduct matching stock items
    const currentStock = JSON.parse(localStorage.getItem(stockKey) || "[]");
    if (currentStock.length > 0 && txData.items?.length > 0) {
      let stockChanged = false;
      const updatedStock = currentStock.map((stockItem) => {
        const soldItem = txData.items.find(
          (item) => item.productName?.toLowerCase() === stockItem.name?.toLowerCase()
        );
        if (soldItem) {
          stockChanged = true;
          return { ...stockItem, quantity: Math.max(0, stockItem.quantity - soldItem.qty) };
        }
        return stockItem;
      });
      if (stockChanged) {
        setStockRaw(updatedStock);
        localStorage.setItem(stockKey, JSON.stringify(updatedStock));
      }
    }

    return newTx;
  }

  function deleteTransaction(id) {
    const updated = transactions.filter((t) => t.id !== id);
    persist(txKey, setTransactionsRaw, updated);
  }

  // Products
  function addProduct(productData) {
    const newProd = { id: Date.now().toString(), ...productData };
    const updated = [...products, newProd];
    persist(prodKey, setProductsRaw, updated);
    return newProd;
  }

  function updateProduct(id, updates) {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    persist(prodKey, setProductsRaw, updated);
  }

  function deleteProduct(id) {
    const updated = products.filter((p) => p.id !== id);
    persist(prodKey, setProductsRaw, updated);
  }

  // Expenses
  function addExpense(expData) {
    const newExp = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" }),
      addedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      ...expData,
    };
    const updated = [newExp, ...expenses];
    persist(expKey, setExpensesRaw, updated);
    return newExp;
  }

  function deleteExpense(id) {
    const updated = expenses.filter((e) => e.id !== id);
    persist(expKey, setExpensesRaw, updated);
  }

  // Team
  function addTeamMember(memberData) {
    const existing = team.find((m) => m.email === memberData.email);
    if (existing) return { success: false, error: "Email already used by a team member" };

    const newMember = {
      id: Date.now().toString(),
      ...memberData,
      status: "active",
      addedOn: new Date().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" }),
    };
    const updated = [...team, newMember];
    persist(teamKey, setTeamRaw, updated);
    return { success: true };
  }

  function removeTeamMember(id) {
    const updated = team.map((m) => (m.id === id ? { ...m, status: "inactive" } : m));
    persist(teamKey, setTeamRaw, updated);
  }

  // Stock
  function addStockItem(itemData) {
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      quantity: Number(itemData.quantity) || 0,
      lowStockThreshold: Number(itemData.lowStockThreshold) || 5,
      addedOn: new Date().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" }),
    };
    const updated = [...stock, newItem];
    persist(stockKey, setStockRaw, updated);
    return newItem;
  }

  function updateStockItem(id, updates) {
    const updated = stock.map((s) => (s.id === id ? { ...s, ...updates } : s));
    persist(stockKey, setStockRaw, updated);
  }

  function deleteStockItem(id) {
    const updated = stock.filter((s) => s.id !== id);
    persist(stockKey, setStockRaw, updated);
  }

  function restockItem(id, addQty) {
    const updated = stock.map((s) =>
      s.id === id ? { ...s, quantity: s.quantity + Number(addQty) } : s
    );
    persist(stockKey, setStockRaw, updated);
  }

  // Analytics helpers
  function getTodaySales() {
    const today = new Date().toDateString();
    return transactions
      .filter((t) => new Date(t.createdAt || Date.now()).toDateString() === today || t.date.includes(new Date().toLocaleDateString("en-GH", { day: "numeric" })))
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }

  function getWeeklyData() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

    return days.map((day, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toDateString();
      const total = transactions
        .filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate.toDateString() === dateStr;
        })
        .reduce((sum, t) => sum + (t.total || 0), 0);
      return { day, total, isToday: date.toDateString() === now.toDateString() };
    });
  }

  function getProductSalesData() {
    const map = {};
    transactions.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        if (!map[item.productName]) map[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        map[item.productName].qty += item.qty;
        map[item.productName].revenue += item.price * item.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  return (
    <AppContext.Provider
      value={{
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
