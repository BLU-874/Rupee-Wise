import React, { useState } from "react";
import { CalendarCheck, Plus } from "lucide-react";
import type { FinancialState, Commitment } from "../types/finance";
import CommitmentList from "../components/CommitmentList";
import { formatINR } from "../utils/finance";

interface CommitmentsProps {
  state: FinancialState;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
  onAddCommitment: (c: Omit<Commitment, "id">) => void;
}

export default function Commitments({
  state,
  onMarkPaid,
  onCancel,
  onAddCommitment,
}: CommitmentsProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    dueDate: "",
    type: "essential" as "essential" | "discretionary",
    recurring: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAddCommitment({
      description: form.description,
      amount: parseInt(form.amount) || 0,
      dueDate: form.dueDate,
      status: "unpaid",
      type: form.type,
      recurring: form.recurring,
    });
    setForm({ description: "", amount: "", dueDate: "", type: "essential", recurring: false });
    setShowForm(false);
  }

  const unpaid = state.commitments.filter((c) => c.status === "unpaid");
  const paid = state.commitments.filter((c) => c.status === "paid");
  const cancelled = state.commitments.filter((c) => c.status === "cancelled");
  const unpaidTotal = unpaid.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarCheck size={20} className="text-[#5138EC]" />
          <h2 className="text-lg font-bold text-[#211F35]">Commitments</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <Plus size={14} /> Add Commitment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
          <p className="text-xs text-[#77748B]">Unpaid</p>
          <p className="text-sm font-bold text-[#C98B27] mt-0.5 tabular-nums">{formatINR(unpaidTotal)}</p>
          <p className="text-xs text-[#77748B] mt-0.5">{unpaid.length} items</p>
        </div>
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
          <p className="text-xs text-[#77748B]">Paid</p>
          <p className="text-sm font-bold text-[#319A77] mt-0.5 tabular-nums">{paid.length} items</p>
          <p className="text-xs text-[#77748B] mt-0.5">completed</p>
        </div>
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
          <p className="text-xs text-[#77748B]">Cancelled</p>
          <p className="text-sm font-bold text-[#77748B] mt-0.5 tabular-nums">{cancelled.length} items</p>
          <p className="text-xs text-[#77748B] mt-0.5">archived</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E8E5F0] bg-white p-5 space-y-3.5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-[#211F35]">New Commitment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Description</label>
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
                placeholder="e.g. Rent"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Amount (₹)</label>
              <input
                required
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Due Date</label>
              <input
                required
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#77748B] block mb-1 font-medium">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "essential" | "discretionary" })}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] focus:border-[#5138EC] focus:bg-white outline-none"
              >
                <option value="essential">Essential</option>
                <option value="discretionary">Discretionary</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                className="accent-[#5138EC]"
              />
              <label htmlFor="recurring" className="text-xs text-[#77748B]">Recurring</label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3] text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-xs"
            >
              Add Commitment
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

      {unpaid.length > 0 && (
        <div className="rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-[#211F35] mb-3.5">Unpaid</h3>
          <CommitmentList commitments={unpaid} onMarkPaid={onMarkPaid} onCancel={onCancel} />
        </div>
      )}

      {paid.length > 0 && (
        <div className="rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-[#211F35] mb-3.5">Paid</h3>
          <CommitmentList commitments={paid} />
        </div>
      )}

      {cancelled.length > 0 && (
        <div className="rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-[#77748B] mb-3.5">Cancelled</h3>
          <CommitmentList commitments={cancelled} />
        </div>
      )}
    </div>
  );
}
