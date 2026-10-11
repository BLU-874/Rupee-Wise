import React, { useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import type { FinancialState, FinancialMetrics, SavingsGoal } from "../types/finance";
import SavingsGoalCard from "../components/SavingsGoalCard";
import { formatINR } from "../utils/finance";

interface SavingsGoalsProps {
  state: FinancialState;
  metrics: FinancialMetrics;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onAddSavings: (goalId: string, amount: number) => void;
  onAddGoal: (goal: Omit<SavingsGoal, "id">) => void;
}

export default function SavingsGoals({
  state,
  metrics,
  onUpdateGoal,
  onAddSavings,
  onAddGoal,
}: SavingsGoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    monthlyContribution: "",
    targetDate: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAddGoal({
      name: form.name,
      targetAmount: parseInt(form.targetAmount) || 1000,
      savedAmount: 0,
      targetDate: form.targetDate || "2027-03-01",
      monthlyContribution: parseInt(form.monthlyContribution) || 0,
    });
    setForm({ name: "", targetAmount: "", monthlyContribution: "", targetDate: "" });
    setShowForm(false);
  }

  const totalSaved = state.savingsGoals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = state.savingsGoals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PiggyBank size={20} className="text-[#5138EC]" />
          <h2 className="text-lg font-bold text-[#211F35]">Savings Goals</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <Plus size={14} /> New Goal
        </button>
      </div>

      {/* Summary */}
      {state.savingsGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
            <p className="text-xs text-[#77748B]">Total Saved</p>
            <p className="text-sm font-bold text-[#319A77] mt-0.5 tabular-nums">{formatINR(totalSaved)}</p>
          </div>
          <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
            <p className="text-xs text-[#77748B]">Total Target</p>
            <p className="text-sm font-bold text-[#211F35] mt-0.5 tabular-nums">{formatINR(totalTarget)}</p>
          </div>
          <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
            <p className="text-xs text-[#77748B]">Overall Progress</p>
            <p className="text-sm font-bold text-[#5138EC] mt-0.5 tabular-nums">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Add goal form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E8E5F0] bg-white p-5 space-y-3.5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-[#211F35]">Add New Goal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Goal Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
                placeholder="e.g. Emergency Fund"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Target Amount (₹)</label>
              <input
                required
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none tabular-nums"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Monthly Contribution (₹)</label>
              <input
                type="number"
                value={form.monthlyContribution}
                onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none tabular-nums"
                placeholder="500"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Target Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-xs"
            >
              Create Goal
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
      )}

      <SavingsGoalCard
        goals={state.savingsGoals}
        metrics={metrics}
        onUpdateGoal={onUpdateGoal}
        onAddSavings={onAddSavings}
      />

      {state.savingsGoals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E8E5F0] bg-white p-12 text-center shadow-xs">
          <PiggyBank size={32} className="text-[#9895A9] mx-auto mb-3" />
          <p className="text-sm text-[#77748B]">No savings goals yet. Create one to track your progress.</p>
        </div>
      )}
    </div>
  );
}
