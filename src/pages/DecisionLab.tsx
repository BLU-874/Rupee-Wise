import { useState } from "react";
import { FlaskConical, Scale, Zap, SlidersHorizontal } from "lucide-react";
import type { FinancialState, PurchaseInput } from "../types/finance";
import DecisionSimulator from "../components/DecisionSimulator";
import DecisionShowdown from "../components/DecisionShowdown";
import { formatINR } from "../utils/finance";

interface DecisionLabProps {
  state: FinancialState;
  onConfirmPurchase: (purchase: PurchaseInput) => void;
}

export default function DecisionLab({ state, onConfirmPurchase }: DecisionLabProps) {
  const [labMode, setLabMode] = useState<"simulator" | "showdown">("simulator");

  const totalSpent = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* ── Header & Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FlaskConical size={20} className="text-[#5138EC]" />
            <h2 className="text-lg font-bold text-[#211F35]">Decision Lab</h2>
          </div>
          <p className="text-sm text-[#77748B]">
            Simulate real-world financial choices before spending. Previewing never alters actual finances.
          </p>
        </div>

        {/* Distinctive Lab Mode Switcher */}
        <div className="flex items-center bg-[#F0EEFA] p-1 rounded-2xl border border-[#E8E5F0] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLabMode("simulator")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              labMode === "simulator"
                ? "bg-white text-[#5138EC] shadow-xs"
                : "text-[#77748B] hover:text-[#211F35]"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Single Purchase</span>
          </button>
          <button
            type="button"
            onClick={() => setLabMode("showdown")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              labMode === "showdown"
                ? "bg-white text-[#5138EC] shadow-xs"
                : "text-[#77748B] hover:text-[#211F35]"
            }`}
          >
            <Scale size={14} />
            <span>Decision Showdown (A vs B)</span>
          </button>
        </div>
      </div>

      {/* Quick stats banner */}
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

      {/* ── Active Lab Mode Display ── */}
      {labMode === "simulator" ? (
        <DecisionSimulator state={state} onConfirmPurchase={onConfirmPurchase} />
      ) : (
        <DecisionShowdown state={state} onConfirmPurchase={onConfirmPurchase} />
      )}

      {/* Educational Guide Card */}
      <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <Zap size={15} className="text-[#5138EC]" />
          <h3 className="text-sm font-semibold text-[#211F35]">How Decision Simulation Works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: "Before vs After Transparency",
              desc: "Every metric is evaluated side-by-side using real mathematical models, so you know the true consequence before spending.",
            },
            {
              title: "Zero Balance Side-Effects",
              desc: "Adjusting sliders, testing presets, or comparing options never alters your ledger. Only explicit confirmation commits a record.",
            },
            {
              title: "Essential Need Protection",
              desc: "The Decision Showdown weighs necessity vs. discretionary consumption, prioritizing essential stability over sheer cheapness.",
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
