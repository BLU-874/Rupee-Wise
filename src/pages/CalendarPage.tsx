import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  IndianRupee,
  Calendar as CalendarIcon,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  Film,
  HelpCircle,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  Target,
} from "lucide-react";
import type { FinancialState, Transaction, Category } from "../types/finance";
import { formatINR, CATEGORY_COLORS } from "../utils/finance";
import {
  getTodayLocalISO,
  parseLocalDate,
  formatFriendlyDate,
  calculateChallengeProgress,
  generateMonthGrid,
} from "../utils/dateUtils";

interface CalendarPageProps {
  state: FinancialState;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  food: Utensils,
  transport: Car,
  bills: Receipt,
  shopping: ShoppingBag,
  entertainment: Film,
  miscellaneous: HelpCircle,
  savings: Target,
  income: IndianRupee,
};

const CATEGORIES: Category[] = [
  "food",
  "transport",
  "bills",
  "shopping",
  "entertainment",
  "miscellaneous",
];

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage({ state, onAddTransaction }: CalendarPageProps) {
  const todayStr = useMemo(() => getTodayLocalISO(), []);
  const todayDate = useMemo(() => parseLocalDate(todayStr), [todayStr]);

  // Current view year & month (0-indexed)
  const [viewYear, setViewYear] = useState(() => todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => todayDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Add Expense Modal / drawer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("food");
  const [formDate, setFormDate] = useState(todayStr);
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Dynamic challenge metrics
  const challenge = useMemo(() => {
    return calculateChallengeProgress(state.periodStart, state.totalDays, todayStr);
  }, [state.periodStart, state.totalDays, todayStr]);

  // Group transactions by date string
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of state.transactions) {
      if (!map.has(tx.date)) {
        map.set(tx.date, []);
      }
      map.get(tx.date)!.push(tx);
    }
    return map;
  }, [state.transactions]);

  // Total spent in active challenge period
  const challengeTotalSpent = useMemo(() => {
    return state.transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          tx.date >= challenge.startDate &&
          tx.date <= challenge.endDate
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [state.transactions, challenge.startDate, challenge.endDate]);

  // Month grid cells
  const monthCells = useMemo(() => {
    return generateMonthGrid(viewYear, viewMonth, state.periodStart, state.totalDays);
  }, [viewYear, viewMonth, state.periodStart, state.totalDays]);

  // Month label
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Navigation handlers
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleGoToToday() {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDateStr(todayStr);
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDateStr(dateStr);
    setFormDate(dateStr);
  }

  function handleOpenAddExpense(targetDate?: string) {
    const d = targetDate || selectedDateStr;
    setFormDate(d);
    setFormDescription("");
    setFormAmount("");
    setFormCategory("food");
    setFormNote("");
    setFormError(null);
    setFormSuccess(false);
    setShowAddForm(true);
  }

  function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const desc = formDescription.trim();
    if (!desc) {
      setFormError("Please enter an expense description.");
      return;
    }

    const numAmount = Number(formAmount);
    if (!formAmount || isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than ₹0.");
      return;
    }

    // Actual expenses must not be recorded for future dates
    if (formDate > todayStr) {
      setFormError("Expenses cannot be recorded for future dates. Use Commitments for future bills.");
      return;
    }

    const sanitizedAmount = Math.max(1, Math.round(numAmount));
    const finalDescription = formNote.trim() ? `${desc} (${formNote.trim()})` : desc;

    onAddTransaction({
      amount: sanitizedAmount,
      category: formCategory,
      description: finalDescription,
      date: formDate,
      type: "expense",
    });

    setFormSuccess(true);
    setTimeout(() => {
      setShowAddForm(false);
      setFormSuccess(false);
    }, 600);
  }

  const selectedDayTransactions = transactionsByDate.get(selectedDateStr) || [];
  const selectedDayExpenses = selectedDayTransactions.filter((tx) => tx.type === "expense");
  const selectedDayTotal = selectedDayExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Challenge Horizon Banner ─────────────────────────────── */}
      <div className="rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] border border-[#E8E5F0] flex items-center justify-center text-[#5138EC]">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#211F35]">30-Day Budget Challenge Timeline</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F6EF] text-[#319A77] border border-[#319A77]/30">
                  {challenge.status === "active" ? "Active Period" : challenge.status}
                </span>
              </div>
              <p className="text-xs text-[#77748B]">
                {formatFriendlyDate(challenge.startDate)} – {formatFriendlyDate(challenge.endDate)} · Day {challenge.currentDay} of {challenge.totalDays}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#F7F6FC] border border-[#E8E5F0]">
              <span className="text-[#77748B]">Current Day</span>
              <p className="text-sm font-bold text-[#211F35] mt-0.5 tabular-nums">
                Day {challenge.currentDay} / 30
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F7F6FC] border border-[#E8E5F0]">
              <span className="text-[#77748B]">Days Left</span>
              <p className="text-sm font-bold text-[#5138EC] mt-0.5 tabular-nums">
                {challenge.daysRemaining} days
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F7F6FC] border border-[#E8E5F0]">
              <span className="text-[#77748B]">Challenge Spend</span>
              <p className="text-sm font-bold text-[#D65D69] mt-0.5 tabular-nums">
                {formatINR(challengeTotalSpent)}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F7F6FC] border border-[#E8E5F0]">
              <span className="text-[#77748B]">Timeline Pace</span>
              <p className="text-sm font-bold text-[#319A77] mt-0.5 tabular-nums">
                {challenge.timeProgressPercent}% elapsed
              </p>
            </div>
          </div>
        </div>

        {/* Challenge Progress Bar */}
        <div className="mt-4 pt-3 border-t border-[#E8E5F0] flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-[#F0EEFA] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#5138EC]"
              style={{ width: `${challenge.timeProgressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-[#5138EC] tabular-nums whitespace-nowrap">
            {challenge.daysRemaining > 0 ? `${challenge.daysRemaining} days remaining` : "Challenge Complete"}
          </span>
        </div>
      </div>

      {/* ── 2. Main Calendar Workspace Grid & Detail Split ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Month View */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[#211F35] capitalize">{monthName}</h3>
              <p className="text-xs text-[#77748B]">
                Click any date to inspect spending or record an expense
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-xl border border-[#E8E5F0] bg-[#F7F6FC] hover:bg-white text-xs font-semibold text-[#211F35] transition-all"
              >
                Today
              </button>
              <div className="flex items-center rounded-xl border border-[#E8E5F0] bg-[#F7F6FC]">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-[#77748B] hover:text-[#211F35] transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="w-[1px] h-4 bg-[#E8E5F0]" />
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-[#77748B] hover:text-[#211F35] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#77748B] pb-2 border-b border-[#E8E5F0]">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {monthCells.map((cell) => {
              const dayTxs = transactionsByDate.get(cell.dateStr) || [];
              const dayExpenses = dayTxs.filter((t) => t.type === "expense");
              const dayTotal = dayExpenses.reduce((s, t) => s + t.amount, 0);
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => handleSelectDate(cell.dateStr)}
                  className={`min-h-[74px] sm:min-h-[82px] p-1.5 rounded-xl text-left border flex flex-col justify-between transition-all duration-150 relative ${
                    isSelected
                      ? "border-[#5138EC] ring-2 ring-[#5138EC]/20 bg-[#EEEAFE]/50 shadow-xs"
                      : cell.isToday
                      ? "border-[#7661F5] bg-[#F7F6FC]"
                      : cell.isWithinChallenge
                      ? "border-[#E8E5F0] bg-white hover:border-[#B6A8FF] hover:bg-[#F7F6FC]/60"
                      : "border-transparent bg-white/40 opacity-45 hover:opacity-80"
                  }`}
                >
                  {/* Top: Day Number & Indicators */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold tabular-nums w-5 h-5 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? "bg-[#5138EC] text-white"
                          : cell.isCurrentMonth
                          ? "text-[#211F35]"
                          : "text-[#9895A9]"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Challenge Start / End pill */}
                    {cell.isChallengeStart && (
                      <span className="text-[9px] font-bold text-[#5138EC] px-1 rounded bg-[#EEEAFE]">
                        Start
                      </span>
                    )}
                    {cell.isChallengeEnd && (
                      <span className="text-[9px] font-bold text-[#7661F5] px-1 rounded bg-[#EEEAFE]">
                        End
                      </span>
                    )}
                  </div>

                  {/* Middle / Bottom: Spent Amount Badge */}
                  <div className="w-full">
                    {dayTotal > 0 ? (
                      <div className="flex items-center justify-between bg-[#FCEAEC] border border-[#D65D69]/25 rounded-md px-1 py-0.5">
                        <span className="text-[10px] font-bold text-[#D65D69] tabular-nums truncate">
                          {formatINR(dayTotal)}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D65D69] flex-shrink-0" />
                      </div>
                    ) : cell.isWithinChallenge && cell.dateStr <= todayStr ? (
                      <span className="text-[10px] text-[#9895A9] pl-0.5">₹0</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-[#E8E5F0] flex flex-wrap items-center gap-4 text-[11px] text-[#77748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5138EC]" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md border border-[#5138EC] bg-[#EEEAFE]" />
              <span>Selected Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-[#FCEAEC] border border-[#D65D69]/30" />
              <span>Recorded Expenses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md border border-[#E8E5F0] bg-white" />
              <span>30-Day Budget Period</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Date Inspection Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs space-y-5">
          {/* Panel Header */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7661F5]">
              Day Breakdown
            </span>
            <h3 className="text-base font-bold text-[#211F35] mt-0.5">
              {formatFriendlyDate(selectedDateStr, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </h3>
            <p className="text-xs text-[#77748B]">
              {selectedDateStr === todayStr ? "Today's activity" : selectedDateStr > todayStr ? "Future date (Planned obligations)" : "Past date entry"}
            </p>
          </div>

          {/* Day Summary Card */}
          <div className="p-4 rounded-xl bg-[#F7F6FC] border border-[#E8E5F0] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#77748B]">Total Spent On This Day</p>
              <p className="text-xl font-bold text-[#211F35] mt-0.5 tabular-nums">
                {formatINR(selectedDayTotal)}
              </p>
            </div>
            <button
              onClick={() => handleOpenAddExpense(selectedDateStr)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>
          </div>

          {/* Transactions List for Selected Date */}
          <div>
            <h4 className="text-xs font-semibold text-[#77748B] uppercase tracking-wider mb-2.5">
              Transactions ({selectedDayExpenses.length})
            </h4>

            {selectedDayExpenses.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedDayExpenses.map((tx) => {
                  const Icon = CATEGORY_ICONS[tx.category] || Tag;
                  const catColor = CATEGORY_COLORS[tx.category] || "#5138EC";

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl border border-[#E8E5F0] bg-white hover:border-[#B6A8FF] transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${catColor}15`, color: catColor }}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#211F35] truncate">
                            {tx.description}
                          </p>
                          <span className="text-[10px] text-[#77748B] capitalize">
                            {tx.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#D65D69] tabular-nums whitespace-nowrap ml-2">
                        -{formatINR(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-[#E8E5F0] bg-[#F7F6FC]/50">
                <p className="text-xs font-semibold text-[#211F35]">No expenses recorded</p>
                <p className="text-[11px] text-[#77748B] mt-0.5">
                  No spending was logged for this date.
                </p>
                <button
                  onClick={() => handleOpenAddExpense(selectedDateStr)}
                  className="mt-3 text-xs font-semibold text-[#5138EC] hover:underline"
                >
                  + Record an expense for this day
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Add Expense Modal / Slide-over ─────────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-[#E8E5F0] shadow-2xl p-6 sm:p-7 text-[#211F35]"
            >
              <button
                onClick={() => setShowAddForm(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-[#77748B] hover:text-[#211F35] hover:bg-[#F0EEFA] transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#EEEAFE] flex items-center justify-center text-[#5138EC]">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#211F35]">Add Expense</h3>
                  <p className="text-xs text-[#77748B]">
                    Date: {formatFriendlyDate(formDate)}
                  </p>
                </div>
              </div>

              {formSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 size={36} className="text-[#319A77] mx-auto" />
                  <p className="text-sm font-bold text-[#211F35]">Expense Saved!</p>
                  <p className="text-xs text-[#77748B]">Updated dashboard and calendar.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  {formError && (
                    <div className="p-2.5 rounded-xl bg-[#FCEAEC] border border-[#D65D69]/30 text-xs text-[#D65D69] flex items-center gap-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#211F35] mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lunch at Cafe"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Amount & Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#211F35] mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        min="1"
                        max="100000"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#211F35] mb-1">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as Category)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] capitalize focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Transaction Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#211F35] mb-1">
                      Transaction Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      max={todayStr}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
                    />
                    <p className="text-[11px] text-[#77748B] mt-1">
                      You can log past expenses within the challenge up to today.
                    </p>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="block text-xs font-semibold text-[#211F35] mb-1">
                      Optional Short Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Split with Rohan"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white font-semibold text-xs shadow-md shadow-[#5138EC]/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={15} />
                      <span>Record Expense</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
