import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Edit2, Check, X } from "lucide-react";
import type { SavingsGoal, FinancialMetrics } from "../types/finance";
import { formatINR } from "../utils/finance";

interface SavingsGoalCardProps {
  goals: SavingsGoal[];
  metrics: FinancialMetrics;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onAddSavings: (goalId: string, amount: number) => void;
}

export default function SavingsGoalCard({
  goals,
  metrics,
  onUpdateGoal,
  onAddSavings,
}: SavingsGoalCardProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [editTarget, setEditTarget] = useState("");
  const [editContrib, setEditContrib] = useState("");
  const [addAmount, setAddAmount] = useState("");

  function startEdit(g: SavingsGoal) {
    setEditing(g.id);
    setEditTarget(String(g.targetAmount));
    setEditContrib(String(g.monthlyContribution));
  }

  function saveEdit(g: SavingsGoal) {
    onUpdateGoal({
      ...g,
      targetAmount: Math.max(1, parseInt(editTarget) || g.targetAmount),
      monthlyContribution: Math.max(0, parseInt(editContrib) || 0),
    });
    setEditing(null);
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8E5F0] bg-[#F7F6FC] p-6 text-center">
        <Target size={24} className="text-[#9895A9] mx-auto mb-2" />
        <p className="text-[#77748B] text-sm">No savings goals yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((g) => {
        const progress = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
        const remaining = Math.max(0, g.targetAmount - g.savedAmount);
        const daysToTarget = Math.ceil(
          (new Date(g.targetDate).getTime() - now) / 86400000
        );
        const monthsToTarget = Math.max(0, Math.ceil(daysToTarget / 30));

        return (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#E8E5F0] bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E7F6EF] flex items-center justify-center">
                  <Target size={16} className="text-[#319A77]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#211F35]">{g.name}</p>
                  <p className="text-xs text-[#77748B]">
                    Target: {new Date(g.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => startEdit(g)}
                className="text-[#77748B] hover:text-[#5138EC] transition-colors p-1"
                title="Edit goal"
              >
                <Edit2 size={13} />
              </button>
            </div>

            {editing === g.id ? (
              <div className="space-y-2 mb-3 bg-[#F0EEFA] p-3 rounded-xl border border-[#E8E5F0]">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-[#77748B] block mb-1">Target (₹)</label>
                    <input
                      type="number"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="w-full bg-white border border-[#E8E5F0] rounded-xl px-2.5 py-1.5 text-sm text-[#211F35] focus:border-[#5138EC] outline-none tabular-nums"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[#77748B] block mb-1">Monthly Contribution (₹)</label>
                    <input
                      type="number"
                      value={editContrib}
                      onChange={(e) => setEditContrib(e.target.value)}
                      className="w-full bg-white border border-[#E8E5F0] rounded-xl px-2.5 py-1.5 text-sm text-[#211F35] focus:border-[#5138EC] outline-none tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(g)}
                    className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white rounded-xl py-1.5 text-xs font-semibold hover:from-[#6b55ed] hover:to-[#4229D3] transition-colors shadow-xs"
                  >
                    <Check size={12} /> Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex items-center gap-1 px-3 bg-white text-[#77748B] border border-[#E8E5F0] rounded-xl py-1.5 text-xs hover:text-[#211F35] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Progress bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#319A77] font-semibold tabular-nums">{formatINR(g.savedAmount)} saved</span>
                <span className="text-[#77748B] tabular-nums">of {formatINR(g.targetAmount)}</span>
              </div>
              <div className="h-2 bg-[#EDEAF4] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#5138EC]"
                />
              </div>
              <div className="flex justify-between text-xs text-[#77748B]">
                <span className="tabular-nums">{progress.toFixed(0)}% complete</span>
                <span className="tabular-nums">{formatINR(remaining)} to go</span>
              </div>
            </div>

            {/* Info row */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-[#F0EEFA] rounded-xl p-2.5 border border-[#E8E5F0]">
                <p className="text-[#77748B]">Monthly contribution</p>
                <p className="text-[#211F35] font-semibold mt-0.5 tabular-nums">{formatINR(g.monthlyContribution)}</p>
              </div>
              <div className="bg-[#F0EEFA] rounded-xl p-2.5 border border-[#E8E5F0]">
                <p className="text-[#77748B]">Months remaining</p>
                <p className="text-[#211F35] font-semibold mt-0.5 tabular-nums">{monthsToTarget} months</p>
              </div>
            </div>

            {/* Impact note */}
            <div className="bg-[#F0EEFA] rounded-xl px-3.5 py-2.5 border border-[#E8E5F0] mb-3 text-xs text-[#77748B] leading-relaxed">
              <p>
                <strong className="text-[#211F35]">Earmarked Savings:</strong> Protecting {formatINR(remaining)} for this goal leaves your discretionary spendable cash at{" "}
                <span className="text-[#5138EC] font-semibold tabular-nums">{formatINR(metrics.spendableBalance)}</span>.
              </p>
              <p className="mt-1 text-[11px] text-[#9895A9]">
                Allocated savings are reserved and shielded from daily spending, keeping your balance safe without being treated as living expenses.
              </p>
            </div>

            {/* Add savings allocation */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Allocate ₹ to goal"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="flex-1 bg-white border border-[#E8E5F0] rounded-xl px-3 py-1.5 text-sm text-[#211F35] placeholder-[#9895A9] focus:border-[#5138EC] outline-none tabular-nums"
                  min={1}
                  max={remaining}
                />
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseInt(addAmount, 10);
                    if (amt > 0) {
                      onAddSavings(g.id, amt);
                      setAddAmount("");
                    }
                  }}
                  disabled={!addAmount || parseInt(addAmount, 10) <= 0}
                  className="flex items-center gap-1 px-3.5 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  <Plus size={13} /> Allocate
                </button>
              </div>
              {parseInt(addAmount, 10) > metrics.spendableBalance && (
                <p className="text-[11px] text-[#C98B27]">
                  ⚠️ Allocating more than your discretionary spendable cash ({formatINR(metrics.spendableBalance)}) will require tightening future daily spend.
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
