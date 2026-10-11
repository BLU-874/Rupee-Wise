import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  List,
  FlaskConical,
  PiggyBank,
  CalendarCheck,
  CalendarDays,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import type { Page } from "../types/finance";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const NAV_ITEMS: { id: Page; label: string; Icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
  { id: "transactions", label: "Transactions", Icon: List },
  { id: "decisionlab", label: "Decision Lab", Icon: FlaskConical },
  { id: "savings", label: "Savings Goals", Icon: PiggyBank },
  { id: "commitments", label: "Commitments", Icon: CalendarCheck },
];

export default function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full bg-[#201E37] border-r border-[#3A3656]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#3A3656]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7661F5] to-[#5138EC] flex items-center justify-center shadow-xs">
          <TrendingUp size={16} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">Rupee</span>
          <span className="font-bold text-[#B6A8FF] text-base tracking-tight">Wise</span>
        </div>
        <button
          onClick={onMobileToggle}
          className="ml-auto lg:hidden text-[#C4C0DB] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6A8FF] rounded-lg p-1"
          aria-label="Close navigation sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5" aria-label="Main Navigation">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => { onNavigate(id); onMobileToggle(); }}
              aria-current={active ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6A8FF] ${
                active
                  ? "bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white shadow-xs font-semibold"
                  : "text-[#C4C0DB] hover:text-white hover:bg-[#292641]"
              }`}
            >
              <Icon size={17} className={active ? "text-white" : "text-[#C4C0DB] group-hover:text-white"} aria-hidden="true" />
              <span>{label}</span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#3A3656]">
        <p className="text-xs text-[#9895A9]">30-Day Challenge</p>
        <p className="text-xs text-[#B6A8FF] font-medium mt-0.5">RupeeWise · ₹10k Budget</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0 sticky top-0 h-screen z-10">{content}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <motion.div
            initial={{ x: -224 }}
            animate={{ x: 0 }}
            exit={{ x: -224 }}
            className="w-56 h-full"
          >
            {content}
          </motion.div>
          <div
            className="flex-1 bg-black/50 backdrop-blur-xs"
            onClick={onMobileToggle}
          />
        </div>
      )}

      {/* Mobile toggle button */}
      <button
        onClick={onMobileToggle}
        className="fixed bottom-4 left-4 z-40 lg:hidden w-11 h-11 rounded-full bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white flex items-center justify-center shadow-lg shadow-[#5138EC]/30 hover:brightness-110 transition-all"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
