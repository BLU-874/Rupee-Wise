import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
import type { FinancialState, Transaction, Category } from "../types/finance";
import { formatINR, CATEGORY_COLORS } from "../utils/finance";
import { validateExpenseAmount } from "../utils/sanitize";

interface TransactionsProps {
  state: FinancialState;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}

const CATEGORIES: Category[] = [
  "food","transport","bills","shopping","entertainment","miscellaneous","income",
];

export default function Transactions({ state, onAddTransaction }: TransactionsProps) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState(() => ({
    amount: "",
    category: "food" as Category,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    type: "expense" as "expense" | "income",
  }));

  const filtered = state.transactions
    .filter((t) =>
      (filterCat === "all" || t.category === filterCat) &&
      (search === "" || t.description.toLowerCase().includes(search.toLowerCase()))
    )
    .slice()
    .reverse();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const validation = validateExpenseAmount(form.amount, 1, 100000);
    if (!validation.isValid) {
      setErrorMsg(validation.error || "Please enter a valid amount greater than ₹0.");
      return;
    }
    const amt = validation.amount;

    onAddTransaction({
      amount: amt,
      category: form.category,
      description: form.description.trim() || form.category,
      date: form.date || new Date().toISOString().slice(0, 10),
      type: form.type,
    });

    setForm({
      amount: "",
      category: "food",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
    });
    setShowForm(false);
    setSuccessMsg("Transaction recorded successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const totalExpenses = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 bg-[#E7F6EF] border border-[#319A77]/30 text-[#319A77] rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs"
          >
            ✓ {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#211F35]">Transactions</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setErrorMsg(null);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-4 flex items-center gap-3 shadow-xs">
          <ArrowDownCircle size={22} className="text-[#D65D69]" />
          <div>
            <p className="text-xs text-[#77748B]">Total Expenses</p>
            <p className="text-base font-bold text-[#211F35] mt-0.5 tabular-nums">{formatINR(totalExpenses)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-4 flex items-center gap-3 shadow-xs">
          <ArrowUpCircle size={22} className="text-[#319A77]" />
          <div>
            <p className="text-xs text-[#77748B]">Total Income</p>
            <p className="text-base font-bold text-[#211F35] mt-0.5 tabular-nums">{formatINR(totalIncome)}</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden shadow-sm"
          >
            <form onSubmit={handleAdd} className="p-5 space-y-3.5">
              <h3 className="text-sm font-semibold text-[#211F35]">New Transaction</h3>

              {errorMsg && (
                <div className="bg-[#FCEAEC] border border-[#D65D69]/30 text-[#D65D69] text-xs font-medium px-3.5 py-2 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#77748B] block mb-1 font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none tabular-nums"
                    placeholder="e.g. 250"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#77748B] block mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#77748B] block mb-1 font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#77748B] block mb-1 font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "expense" | "income" })}
                    className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#77748B] block mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] placeholder-[#9895A9] focus:border-[#5138EC] focus:bg-white outline-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-xs"
                >
                  Save Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 bg-[#F0EEFA] text-[#77748B] border border-[#E8E5F0] rounded-xl text-sm font-medium hover:text-[#211F35] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-[#E8E5F0] rounded-xl px-3.5 py-2 flex-1 min-w-48 shadow-xs">
          <Search size={14} className="text-[#9895A9]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="bg-transparent text-sm text-[#211F35] placeholder-[#9895A9] outline-none w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...CATEGORIES] as (Category | "all")[]).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-all ${
                filterCat === c
                  ? "bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white font-semibold shadow-xs"
                  : "bg-white border border-[#E8E5F0] text-[#77748B] hover:text-[#211F35] hover:border-[#B6A8FF]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#77748B] text-sm">No transactions found</div>
        ) : (
          <div className="divide-y divide-[#EDEAF4]">
            {filtered.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F7F6FC] transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[tx.category] || "#77748B" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#211F35] font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-[#77748B] capitalize">
                    {tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold flex-shrink-0 tabular-nums ${
                    tx.type === "income" ? "text-[#319A77]" : "text-[#211F35]"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
