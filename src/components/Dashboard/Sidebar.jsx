import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  BarChart2,
  TrendingUp,
  Settings,
  Package,
  X,
} from "lucide-react";
import logo from "../../assets/logo.svg";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { to: "/dashboard/stock", label: "Stock", icon: Package },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart2 },
  { to: "/dashboard/analysis", label: "Analysis", icon: TrendingUp },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }) {
  const { currentUser, canViewReports, canManageExpenses } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (item.to === "/dashboard/reports" && !canViewReports) return false;
    if (item.to === "/dashboard/expenses" && !canManageExpenses) return false;
    if (item.to === "/dashboard/stock" && !canManageExpenses) return false;
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-30 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <img src={logo} alt="logo" className="w-8 h-8" />
          <span className="text-lg font-semibold text-teal-600">DwaTrack</span>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {visibleItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors
                    ${isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User card at bottom */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 m-0 truncate">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs text-gray-500 m-0 capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
