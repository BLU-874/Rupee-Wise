import { useState, useMemo } from "react";
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import type { FinancialState, Category, PurchaseInput, ShowdownOptionInput } from "../types/finance";
import { evaluateShowdown, formatINR } from "../utils/finance";
import { sanitizeText, sanitizeAmount } from "../utils/sanitize";

interface DecisionShowdownProps {
  state: FinancialState;
  onConfirmPurchase: (purchase: PurchaseInput) => void;
}

const CATEGORIES: Category[] = [
  "food",
  "transport",
  "bills",
  "shopping",
  "entertainment",
  "miscellaneous",
];

const PRESET_SHOWDOWNS = [
  {
    title: "Healthcare vs. Dining Out",
    optA: { description: "Doctor Visit & Medicine", amount: "850", category: "bills" as Category, essential: true },
    optB: { description: "Weekend Social Dining", amount: "650", category: "food" as Category, essential: false },
  },
  {
    title: "Study Material vs. Gaming",
    optA: { description: "Exam Prep Reference Book", amount: "750", category: "bills" as Category, essential: true },
    optB: { description: "Game Season Pass", amount: "899", category: "entertainment" as Category, essential: false },
  },
  {
    title: "Essential Travel vs. Sale Shopping",
    optA: { description: "Metro Pass Recharge", amount: "600", category: "transport" as Category, essential: true },
    optB: { description: "Flash Sale Sneakers", amount: "1500", category: "shopping" as Category, essential: false },
  },
];

export default function DecisionShowdown({ state, onConfirmPurchase }: DecisionShowdownProps) {
  // Option A state
  const [descA, setDescA] = useState("Doctor Visit & Medicine");
  const [amtA, setAmtA] = useState("850");
  const [catA, setCatA] = useState<Category>("bills");
  const [essA, setEssA] = useState(true);

  // Option B state
  const [descB, setDescB] = useState("Weekend Social Dining");
  const [amtB, setAmtB] = useState("650");
  const [catB, setCatB] = useState<Category>("food");
  const [essB, setEssB] = useState(false);

  const [confirmedChoice, setConfirmedChoice] = useState<"A" | "B" | null>(null);

  // Parsed and bounded numeric values
  const numA = useMemo(() => sanitizeAmount(amtA, 1, 50000, 0), [amtA]);
  const numB = useMemo(() => sanitizeAmount(amtB, 1, 50000, 0), [amtB]);

  const isValidA = numA > 0;
  const isValidB = numB > 0;
  const isReady = isValidA && isValidB;

  const showdown = useMemo(() => {
    if (!isReady) return null;

    const optA: ShowdownOptionInput = {
      id: "A",
      description: sanitizeText(descA, 60) || "Option A",
      amount: numA,
      category: catA,
      essential: essA,
    };

    const optB: ShowdownOptionInput = {
      id: "B",
      description: sanitizeText(descB, 60) || "Option B",
      amount: numB,
      category: catB,
      essential: essB,
    };

    return evaluateShowdown(state, optA, optB);
  }, [state, isReady, descA, numA, catA, essA, descB, numB, catB, essB]);

  function handleApplyPreset(index: number) {
    const p = PRESET_SHOWDOWNS[index];
    setDescA(p.optA.description);
    setAmtA(p.optA.amount);
    setCatA(p.optA.category);
    setEssA(p.optA.essential);

    setDescB(p.optB.description);
    setAmtB(p.optB.amount);
    setCatB(p.optB.category);
    setEssB(p.optB.essential);
    setConfirmedChoice(null);
  }

  function handleConfirmOption(optionKey: "A" | "B") {
    if (!isReady || !showdown) return;

    const opt = optionKey === "A" ? showdown.optionA.option : showdown.optionB.option;
    onConfirmPurchase({
      amount: opt.amount,
      description: opt.description,
      category: opt.category,
      essential: opt.essential,
    });

    setConfirmedChoice(optionKey);
    setTimeout(() => {
      setConfirmedChoice(null);
      // Reset to neutral inputs
      setDescA("");
      setAmtA("500");
      setDescB("");
      setAmtB("500");
    }, 2200);
  }

  function handleReset() {
    setDescA("");
    setAmtA("500");
    setCatA("shopping");
    setEssA(false);

    setDescB("");
    setAmtB("500");
    setCatB("entertainment");
    setEssB(false);
    setConfirmedChoice(null);
  }

  const cur = showdown?.current;
  const sA = showdown?.optionA.simulation;
  const sB = showdown?.optionB.simulation;
  const rec = showdown?.recommendation;

  return (
    <div className="space-y-6">
      {/* ── Preset Showdowns Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8E5F0] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#211F35]">
          <SlidersHorizontal size={14} className="text-[#5138EC]" />
          <span>Real-World Dilemma Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SHOWDOWNS.map((p, idx) => (
            <button
              key={p.title}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="text-xs px-3 py-1.5 rounded-xl border border-[#E8E5F0] bg-[#F7F6FC] hover:bg-[#EEEAFE] hover:border-[#5138EC]/30 text-[#5138EC] font-medium transition-all"
            >
              {p.title}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-2.5 py-1.5 rounded-xl text-[#77748B] hover:text-[#211F35] transition-colors flex items-center gap-1"
            title="Reset options"
          >
            <RefreshCw size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* ── Option Input Grid (Option A vs Option B) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A Card */}
        <div className="bg-white rounded-2xl border-2 border-[#5138EC]/20 p-5 shadow-xs space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#5138EC] text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <h3 className="text-sm font-bold text-[#211F35]">Option A: Hypothetical Choice</h3>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                essA
                  ? "bg-[#E7F6EF] text-[#319A77] border border-[#319A77]/30"
                  : "bg-[#F0EEFA] text-[#7661F5] border border-[#E8E5F0]"
              }`}
            >
              {essA ? "Essential Need" : "Discretionary Want"}
            </span>
          </div>

          <div>
            <label htmlFor="opt-a-desc" className="block text-xs font-medium text-[#77748B] mb-1">
              Description
            </label>
            <input
              id="opt-a-desc"
              type="text"
              placeholder="e.g. Health prescription"
              value={descA}
              onChange={(e) => setDescA(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="opt-a-amt" className="block text-xs font-medium text-[#77748B] mb-1">
                Amount (₹)
              </label>
              <input
                id="opt-a-amt"
                type="number"
                min="1"
                max="50000"
                value={amtA}
                onChange={(e) => setAmtA(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="opt-a-cat" className="block text-xs font-medium text-[#77748B] mb-1">
                Category
              </label>
              <select
                id="opt-a-cat"
                value={catA}
                onChange={(e) => setCatA(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] capitalize focus:outline-none focus:border-[#5138EC]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#211F35] font-medium">Classify as Essential Need</span>
            <button
              type="button"
              onClick={() => setEssA(!essA)}
              className={`w-10 h-5 rounded-full transition-all relative ${
                essA ? "bg-[#5138EC]" : "bg-[#EDEAF4]"
              }`}
              aria-label="Toggle Option A essential status"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  essA ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Option B Card */}
        <div className="bg-white rounded-2xl border-2 border-[#7661F5]/20 p-5 shadow-xs space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#7661F5] text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <h3 className="text-sm font-bold text-[#211F35]">Option B: Hypothetical Choice</h3>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                essB
                  ? "bg-[#E7F6EF] text-[#319A77] border border-[#319A77]/30"
                  : "bg-[#F0EEFA] text-[#7661F5] border border-[#E8E5F0]"
              }`}
            >
              {essB ? "Essential Need" : "Discretionary Want"}
            </span>
          </div>

          <div>
            <label htmlFor="opt-b-desc" className="block text-xs font-medium text-[#77748B] mb-1">
              Description
            </label>
            <input
              id="opt-b-desc"
              type="text"
              placeholder="e.g. Weekend social dining"
              value={descB}
              onChange={(e) => setDescB(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#7661F5] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="opt-b-amt" className="block text-xs font-medium text-[#77748B] mb-1">
                Amount (₹)
              </label>
              <input
                id="opt-b-amt"
                type="number"
                min="1"
                max="50000"
                value={amtB}
                onChange={(e) => setAmtB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#7661F5] tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="opt-b-cat" className="block text-xs font-medium text-[#77748B] mb-1">
                Category
              </label>
              <select
                id="opt-b-cat"
                value={catB}
                onChange={(e) => setCatB(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] capitalize focus:outline-none focus:border-[#7661F5]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#211F35] font-medium">Classify as Essential Need</span>
            <button
              type="button"
              onClick={() => setEssB(!essB)}
              className={`w-10 h-5 rounded-full transition-all relative ${
                essB ? "bg-[#5138EC]" : "bg-[#EDEAF4]"
              }`}
              aria-label="Toggle Option B essential status"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  essB ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Three-Way Comparison Matrix ── */}
      {showdown && cur && sA && sB && rec && (
        <div className="space-y-4">
          {/* Smart Recommendation Banner */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition-all ${
              rec.winner === "A"
                ? "bg-[#EEEAFE] border-[#5138EC]/30 text-[#211F35]"
                : rec.winner === "B"
                ? "bg-[#F0EEFA] border-[#7661F5]/30 text-[#211F35]"
                : rec.winner === "neither"
                ? "bg-[#FCEAEC] border-[#D65D69]/30 text-[#211F35]"
                : "bg-white border-[#E8E5F0] text-[#211F35]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-[#5138EC]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#5138EC]">
                  Showdown Analysis
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/80 border border-black/10">
                  {rec.badgeText}
                </span>
              </div>
              {rec.savingsPreservedDiff > 0 && (
                <span className="text-xs font-semibold text-[#319A77] bg-[#E7F6EF] px-2 py-0.5 rounded-md border border-[#319A77]/20">
                  Cash Difference: {formatINR(rec.savingsPreservedDiff)}
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold mb-1 text-[#211F35]">{rec.headline}</h4>
            <p className="text-xs text-[#77748B] leading-relaxed">{rec.analysis}</p>
          </div>

          {/* Three-Way Comparison Table (Deep Indigo Styling) */}
          <div className="bg-[#201E37] rounded-2xl border border-[#3A3656] p-5 shadow-sm text-white overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3A3656]">
              <div>
                <p className="text-xs font-semibold text-[#B6A8FF] uppercase tracking-wider">
                  Three-Way Matrix
                </p>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  Current Financial Plan vs. Option A vs. Option B
                </h4>
              </div>
              <span className="text-[11px] text-[#C4C0DB]">Simulation only · No financial changes</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#3A3656]/60 text-[#C4C0DB]">
                  <th className="py-2.5 font-semibold">Key Metric</th>
                  <th className="py-2.5 font-semibold text-center text-[#9895A9]">Current State</th>
                  <th className="py-2.5 font-semibold text-center text-[#B6A8FF] bg-[#292641]/50 rounded-t-lg">
                    Option A ({formatINR(numA)})
                  </th>
                  <th className="py-2.5 font-semibold text-center text-[#B6A8FF] bg-[#292641]/80 rounded-t-lg">
                    Option B ({formatINR(numB)})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3656]/40">
                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Available Balance</td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white">
                    {formatINR(cur.availableBalance)}
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-[#C4C0DB] bg-[#292641]/50">
                    {formatINR(sA.after.availableBalance)}
                    <span className="block text-[10px] text-[#D65D69]">-{formatINR(numA)}</span>
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-[#C4C0DB] bg-[#292641]/80">
                    {formatINR(sB.after.availableBalance)}
                    <span className="block text-[10px] text-[#D65D69]">-{formatINR(numB)}</span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Spendable Balance</td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white">
                    {formatINR(cur.spendableBalance)}
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums bg-[#292641]/50">
                    <span
                      className={
                        sA.after.spendableBalance <= 0 ? "text-[#D65D69]" : "text-white"
                      }
                    >
                      {formatINR(sA.after.spendableBalance)}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums bg-[#292641]/80">
                    <span
                      className={
                        sB.after.spendableBalance <= 0 ? "text-[#D65D69]" : "text-white"
                      }
                    >
                      {formatINR(sB.after.spendableBalance)}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Safe Daily Allowance</td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-[#319A77]">
                    {formatINR(cur.safeDailyAllowance)}/day
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white bg-[#292641]/50">
                    {formatINR(sA.after.safeDailyAllowance)}/day
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white bg-[#292641]/80">
                    {formatINR(sB.after.safeDailyAllowance)}/day
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Projected Month-End</td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white">
                    {formatINR(cur.projectedMonthEnd)}
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums bg-[#292641]/50">
                    <span
                      className={
                        sA.after.projectedMonthEnd < 0 ? "text-[#D65D69]" : "text-white"
                      }
                    >
                      {formatINR(sA.after.projectedMonthEnd)}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums bg-[#292641]/80">
                    <span
                      className={
                        sB.after.projectedMonthEnd < 0 ? "text-[#D65D69]" : "text-white"
                      }
                    >
                      {formatINR(sB.after.projectedMonthEnd)}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Savings Feasibility</td>
                  <td className="py-2.5 text-center font-semibold text-[#319A77]">Protected</td>
                  <td className="py-2.5 text-center font-semibold bg-[#292641]/50">
                    <span
                      className={
                        sA.after.spendableBalance <= 0 ||
                        sA.after.projectedMonthEnd < cur.remainingSavingsReq
                          ? "text-[#D65D69]"
                          : "text-[#319A77]"
                      }
                    >
                      {sA.after.spendableBalance <= 0 ||
                      sA.after.projectedMonthEnd < cur.remainingSavingsReq
                        ? "Compromised"
                        : "Maintained"}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-semibold bg-[#292641]/80">
                    <span
                      className={
                        sB.after.spendableBalance <= 0 ||
                        sB.after.projectedMonthEnd < cur.remainingSavingsReq
                          ? "text-[#D65D69]"
                          : "text-[#319A77]"
                      }
                    >
                      {sB.after.spendableBalance <= 0 ||
                      sB.after.projectedMonthEnd < cur.remainingSavingsReq
                        ? "Compromised"
                        : "Maintained"}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Risk Tier</td>
                  <td className="py-2.5 text-center font-bold text-white">{cur.riskLevel}</td>
                  <td className="py-2.5 text-center font-bold bg-[#292641]/50">
                    <span
                      className={
                        sA.after.riskLevel === "High"
                          ? "text-[#D65D69]"
                          : sA.after.riskLevel === "Moderate"
                          ? "text-[#C98B27]"
                          : "text-[#319A77]"
                      }
                    >
                      {sA.after.riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-bold bg-[#292641]/80">
                    <span
                      className={
                        sB.after.riskLevel === "High"
                          ? "text-[#D65D69]"
                          : sB.after.riskLevel === "Moderate"
                          ? "text-[#C98B27]"
                          : "text-[#319A77]"
                      }
                    >
                      {sB.after.riskLevel}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 font-medium text-[#C4C0DB]">Financial Health Score</td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white">
                    {cur.healthScore}/100
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white bg-[#292641]/50">
                    {sA.after.healthScore}/100
                    <span
                      className={`block text-[10px] ${
                        sA.deltas.healthScore < 0 ? "text-[#D65D69]" : "text-[#319A77]"
                      }`}
                    >
                      {sA.deltas.healthScore} pts
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-bold tabular-nums text-white bg-[#292641]/80">
                    {sB.after.healthScore}/100
                    <span
                      className={`block text-[10px] ${
                        sB.deltas.healthScore < 0 ? "text-[#D65D69]" : "text-[#319A77]"
                      }`}
                    >
                      {sB.deltas.healthScore} pts
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Direct Decision Commit Actions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleConfirmOption("A")}
              disabled={confirmedChoice !== null}
              className={`p-3.5 rounded-2xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                rec.winner === "A"
                  ? "bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white border-transparent"
                  : "bg-white hover:bg-[#F7F6FC] text-[#211F35] border-[#E8E5F0]"
              }`}
            >
              {confirmedChoice === "A" ? (
                <>
                  <CheckCircle2 size={15} className="text-[#319A77]" />
                  <span>Option A Recorded to Ledger!</span>
                </>
              ) : (
                <>
                  <span>Choose & Commit Option A ({formatINR(numA)})</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleConfirmOption("B")}
              disabled={confirmedChoice !== null}
              className={`p-3.5 rounded-2xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                rec.winner === "B"
                  ? "bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white border-transparent"
                  : "bg-white hover:bg-[#F7F6FC] text-[#211F35] border-[#E8E5F0]"
              }`}
            >
              {confirmedChoice === "B" ? (
                <>
                  <CheckCircle2 size={15} className="text-[#319A77]" />
                  <span>Option B Recorded to Ledger!</span>
                </>
              ) : (
                <>
                  <span>Choose & Commit Option B ({formatINR(numB)})</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
