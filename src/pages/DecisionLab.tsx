import { FlaskConical, Zap } from "lucide-react";
import type { FinancialState, PurchaseInput } from "../types/finance";
import DecisionSimulator from "../components/DecisionSimulator";
import { formatINR } from "../utils/finance";

interface DecisionLabProps {
  state: FinancialState;
  onConfirmPurchase: (purchase: PurchaseInput) => void;
}

export default function DecisionLab({ state, onConfirmPurchase }: DecisionLabProps) {
  const totalSpent = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <FlaskConical size={20} className="text-[#5138EC]" />
          <h2 className="text-lg font-bold text-[#211F35]">Decision Lab</h2>
        </div>
        <p className="text-sm text-[#77748B]">
          Test financial decisions in real time before committing to them. Previewing a purchase does not change your actual balance.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Starting Budget", value: formatINR(state.startingBudget) },
          { label: "Already Spent", value: formatINR(totalSpent) },
          { label: "Days Remaining", value: `${state.totalDays - state.currentDay} of ${state.totalDays}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#E8E5F0] bg-white p-3.5 text-center shadow-xs">
            <p className="text-xs text-[#77748B]">{s.label}</p>
            <p className="text-base font-bold text-[#211F35] mt-0.5 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Simulator */}
      <DecisionSimulator state={state} onConfirmPurchase={onConfirmPurchase} />

      {/* Quick examples */}
      <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <Zap size={15} className="text-[#5138EC]" />
          <h3 className="text-sm font-semibold text-[#211F35]">How the simulator works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: "Before vs After",
              desc: "Every key metric is shown side-by-side so you can see the exact consequence of a purchase.",
            },
            {
              title: "No side effects",
              desc: "Adjusting the slider or description never records a transaction. Only 'Confirm & Commit' does.",
            },
            {
              title: "Risk warnings",
              desc: "If a purchase threatens essential commitments or the month-end balance, a visible warning appears.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#F0EEFA] rounded-xl p-3.5 border border-[#E8E5F0]">
              <p className="text-xs font-semibold text-[#5138EC] mb-1">{item.title}</p>
              <p className="text-xs text-[#77748B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
