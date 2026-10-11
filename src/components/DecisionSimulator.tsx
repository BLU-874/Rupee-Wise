import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import type { FinancialState, Category, PurchaseInput } from "../types/finance";
import { simulatePurchase, formatINR } from "../utils/finance";

interface DecisionSimulatorProps {
  state: FinancialState;
  onConfirmPurchase: (purchase: PurchaseInput) => void;
}

const CATEGORIES: Category[] = [
  "food", "transport", "bills", "shopping", "entertainment", "miscellaneous",
];

interface MetricRowProps {
  label: string;
  before: string;
  after: string;
  deltaText?: string;
  deltaType?: "positive" | "negative" | "neutral";
}

function MetricRow({ label, before, after, deltaText, deltaType = "neutral" }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#3A3656]/60 last:border-b-0">
      <span className="text-xs text-[#C4C0DB] font-medium">{label}</span>
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-[#9895A9] tabular-nums">{before}</span>
        {deltaText && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
              deltaType === "positive"
                ? "bg-[#319A77]/20 text-[#319A77]"
                : deltaType === "negative"
                ? "bg-[#D65D69]/20 text-[#D65D69]"
                : "bg-[#3A3656] text-[#C4C0DB]"
            }`}
          >
            {deltaText}
          </span>
        )}
        <span className="text-[#9895A9] text-xs">→</span>
        <span
          className={`text-xs font-bold tabular-nums min-w-[70px] text-right ${
            deltaType === "negative"
              ? "text-[#D65D69]"
              : deltaType === "positive"
              ? "text-[#319A77]"
              : "text-white"
          }`}
        >
          {after}
        </span>
      </div>
    </div>
  );
}

export default function DecisionSimulator({ state, onConfirmPurchase }: DecisionSimulatorProps) {
  const [simulationMode, setSimulationMode] = useState<"standard" | "unexpected">("standard");
  const [amountInput, setAmountInput] = useState<string>("500");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("shopping");
  const [essential, setEssential] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const maxAmount = Math.max(state.startingBudget * 1.5, 20000);

  const numericAmount = useMemo(() => {
    const val = parseInt(amountInput, 10);
    return isNaN(val) ? 0 : val;
  }, [amountInput]);

  const isValidAmount = numericAmount > 0 && numericAmount <= 50000;

  const simulation = useMemo(() => {
    if (!isValidAmount) return null;
    return simulatePurchase(state, numericAmount, essential, category);
  }, [state, numericAmount, essential, category, isValidAmount]);

  const b = simulation?.before;
  const a = simulation?.after;

  function handleAmountChange(val: string) {
    setAmountInput(val);
  }

  function handleSliderChange(val: number) {
    setAmountInput(String(val));
  }

  function handlePreset(presetName: string, presetAmount: number, presetCat: Category, isEss: boolean) {
    setDescription(presetName);
    setAmountInput(String(presetAmount));
    setCategory(presetCat);
    setEssential(isEss);
    setShowConfirmDialog(false);
  }

  function handleConfirm() {
    if (!simulation || !isValidAmount || isSubmitting) return;

    // Consequential action confirmation
    if ((numericAmount > 2000 || simulation.outcomeType === "high_risk") && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    setIsSubmitting(true);
    onConfirmPurchase({
      amount: numericAmount,
      description: description.trim() || (simulationMode === "unexpected" ? "Unexpected Emergency Expense" : category),
      category,
      essential,
    });

    setConfirmed(true);
    setShowConfirmDialog(false);

    setTimeout(() => {
      setConfirmed(false);
      setIsSubmitting(false);
      setAmountInput("500");
      setDescription("");
      setEssential(false);
      setSimulationMode("standard");
    }, 2500);
  }

  function handleReset() {
    setSimulationMode("standard");
    setAmountInput("500");
    setDescription("");
    setCategory("shopping");
    setEssential(false);
    setShowConfirmDialog(false);
    setConfirmed(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: White Input Controls */}
      <div className="lg:col-span-5 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div>
          {/* Mode Switcher: Standard vs Unexpected Emergency */}
          <div className="flex rounded-xl bg-[#F0EEFA] p-1 border border-[#E8E5F0] mb-5">
            <button
              type="button"
              onClick={() => {
                setSimulationMode("standard");
                setEssential(false);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                simulationMode === "standard"
                  ? "bg-white text-[#5138EC] shadow-xs"
                  : "text-[#77748B] hover:text-[#211F35]"
              }`}
            >
              Planned Purchase
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulationMode("unexpected");
                setEssential(true);
                setCategory("miscellaneous");
                if (!description) setDescription("Emergency Medical / Urgent Repair");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                simulationMode === "unexpected"
                  ? "bg-gradient-to-r from-[#D65D69] to-[#C98B27] text-white shadow-xs"
                  : "text-[#77748B] hover:text-[#211F35]"
              }`}
            >
              ⚡ Unexpected Expense
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#EDEAF4]">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                simulationMode === "unexpected"
                  ? "bg-[#FCEAEC] text-[#D65D69]"
                  : "bg-[#EEEAFE] text-[#5138EC]"
              }`}
            >
              <FlaskConical size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#211F35]">
                {simulationMode === "unexpected" ? "Simulate Unexpected Shock" : "Simulate Proposed Purchase"}
              </h3>
              <p className="text-xs text-[#77748B]">
                {simulationMode === "unexpected"
                  ? "Test budget resilience against unexpected emergency costs"
                  : "Model financial consequence before spending"}
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <span className="text-[11px] text-[#9895A9] font-medium block mb-1.5 uppercase tracking-wide">
              {simulationMode === "unexpected" ? "Emergency Scenarios" : "Quick Presets"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {simulationMode === "unexpected" ? (
                <>
                  <button
                    type="button"
                    onClick={() => handlePreset("Phone Screen Repair", 1800, "miscellaneous", true)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#D65D69] hover:text-[#D65D69] transition-all"
                  >
                    Phone Repair (₹1,800)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset("Medical Clinic & Meds", 2500, "miscellaneous", true)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#D65D69] hover:text-[#D65D69] transition-all"
                  >
                    Medical Clinic (₹2,500)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset("Urgent Home Travel", 3500, "transport", true)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#D65D69] hover:text-[#D65D69] transition-all"
                  >
                    Urgent Travel (₹3,500)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handlePreset("Weekend Dining", 650, "food", false)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#5138EC] hover:text-[#5138EC] transition-all"
                  >
                    Dinner (₹650)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset("Concert Pass", 2000, "entertainment", false)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#5138EC] hover:text-[#5138EC] transition-all"
                  >
                    Concert (₹2,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset("New Sneakers", 3200, "shopping", false)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#211F35] border border-[#E8E5F0] hover:border-[#5138EC] hover:text-[#5138EC] transition-all"
                  >
                    Sneakers (₹3,200)
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Amount input & slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#77748B] font-medium">Proposed Amount</label>
                <div className="flex items-center gap-1 bg-[#F0EEFA] border border-[#E8E5F0] rounded-lg px-2.5 py-1">
                  <span className="text-xs text-[#77748B]">₹</span>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-20 bg-transparent text-sm font-bold text-[#5138EC] outline-none tabular-nums"
                    min={1}
                    max={maxAmount}
                  />
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={maxAmount}
                value={numericAmount || 1}
                onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#5138EC]"
              />
              <div className="flex justify-between text-xs text-[#9895A9] mt-1 tabular-nums">
                <span>₹1</span>
                <span>₹{(maxAmount / 1000).toFixed(0)}k</span>
              </div>
              {!isValidAmount && (
                <p className="text-[11px] text-[#D65D69] font-medium mt-1">
                  Please enter a valid amount between ₹1 and ₹50,000.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-[#77748B] font-medium block mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={simulationMode === "unexpected" ? "e.g. Urgent Dentist Visit" : "e.g. Wireless Headphones"}
                className="w-full bg-[#F7F6FC] border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-sm text-[#211F35] placeholder-[#9895A9] focus:border-[#5138EC] focus:bg-white outline-none transition-colors"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="text-xs text-[#77748B] font-medium block mb-1.5">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const isSelected = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white font-semibold shadow-xs"
                          : "bg-[#F0EEFA] text-[#77748B] border border-[#E8E5F0] hover:text-[#211F35] hover:border-[#B6A8FF]"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Essential toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#77748B]">
                Classification:{" "}
                <span className={essential ? "text-[#5138EC] font-semibold" : "text-[#77748B]"}>
                  {essential ? "Essential Need (Non-Negotiable)" : "Discretionary (Optional Want)"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setEssential(!essential)}
                className={`w-10 h-5 rounded-full transition-all relative ${
                  essential ? "bg-[#5138EC]" : "bg-[#EDEAF4]"
                }`}
              >
                <motion.div
                  animate={{ x: essential ? 22 : 2 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Reset button at bottom of input column */}
        <div className="pt-5 mt-5 border-t border-[#EDEAF4]">
          <button
            type="button"
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#77748B] hover:text-[#211F35] transition-colors"
          >
            <RefreshCw size={13} />
            Reset Simulator
          </button>
        </div>
      </div>

      {/* Right Column: Deep Indigo Signature Comparison Panel */}
      <div className="lg:col-span-7 rounded-2xl border border-[#3A3656] bg-[#201E37] p-6 shadow-sm text-white flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#3A3656]">
            <div>
              <p className="text-xs font-semibold text-[#B6A8FF] uppercase tracking-wider">Financial Consequence</p>
              <h3 className="text-base font-bold text-white mt-0.5">Live Before vs After Projection</h3>
            </div>
            {simulation && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  simulation.outcomeType === "affordable"
                    ? "bg-[#319A77]/20 border-[#319A77]/40 text-[#319A77]"
                    : simulation.outcomeType === "savings_affected" || simulation.outcomeType === "caution"
                    ? "bg-[#C98B27]/20 border-[#C98B27]/40 text-[#C98B27]"
                    : "bg-[#D65D69]/20 border-[#D65D69]/40 text-[#D65D69]"
                }`}
              >
                {simulation.outcomeTitle}
              </span>
            )}
          </div>

          {/* Metrics comparison table */}
          {simulation && b && a ? (
            <div className="space-y-1 mb-4">
              <MetricRow
                label="Available Balance"
                before={formatINR(b.availableBalance)}
                after={formatINR(a.availableBalance)}
                deltaText={`-${formatINR(numericAmount)}`}
                deltaType="negative"
              />
              <MetricRow
                label="Spendable Balance"
                before={formatINR(b.spendableBalance)}
                after={formatINR(a.spendableBalance)}
                deltaText={simulation.deltas.spendableBalance !== 0 ? `-${formatINR(Math.abs(simulation.deltas.spendableBalance))}` : "±0"}
                deltaType={simulation.deltas.spendableBalance < 0 ? "negative" : "neutral"}
              />
              <MetricRow
                label="Safe Daily Allowance"
                before={`${formatINR(b.safeDailyAllowance)}/day`}
                after={`${formatINR(a.safeDailyAllowance)}/day`}
                deltaText={simulation.deltas.safeDailyAllowance !== 0 ? `-${formatINR(Math.abs(simulation.deltas.safeDailyAllowance))}/d` : "±0"}
                deltaType={simulation.deltas.safeDailyAllowance < 0 ? "negative" : "neutral"}
              />
              <MetricRow
                label="Month-End Forecast"
                before={formatINR(b.projectedMonthEnd)}
                after={formatINR(a.projectedMonthEnd)}
                deltaText={`-${formatINR(Math.abs(simulation.deltas.projectedMonthEnd))}`}
                deltaType="negative"
              />
              <MetricRow
                label="Savings Goal Feasibility"
                before="Protected"
                after={a.spendableBalance <= 0 || a.projectedMonthEnd < b.remainingSavingsReq ? "At Risk" : "Maintained"}
                deltaType={a.spendableBalance <= 0 || a.projectedMonthEnd < b.remainingSavingsReq ? "negative" : "positive"}
              />
              <MetricRow
                label="Financial Health Score"
                before={`${b.healthScore}/100`}
                after={`${a.healthScore}/100`}
                deltaText={simulation.deltas.healthScore !== 0 ? `${simulation.deltas.healthScore} pts` : "±0"}
                deltaType={simulation.deltas.healthScore < 0 ? "negative" : "neutral"}
              />
            </div>
          ) : (
            <div className="py-12 text-center text-[#C4C0DB]">
              <p className="text-xs">Enter a valid amount to preview consequences</p>
            </div>
          )}

          {/* Consequence statement */}
          {simulation && (
            <div className="bg-[#292641] rounded-xl p-3.5 border border-[#3A3656] mb-3.5">
              <p className="text-xs text-[#C4C0DB] leading-relaxed">
                {simulation.consequenceExplanation}
              </p>
            </div>
          )}

          {/* Warning Message if any */}
          <AnimatePresence>
            {simulation?.warningMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 mb-3.5 border ${
                  simulation.outcomeType === "high_risk"
                    ? "bg-[#D65D69]/15 border-[#D65D69]/30 text-[#FCEAEC]"
                    : "bg-[#C98B27]/15 border-[#C98B27]/30 text-[#FFF4DE]"
                }`}
              >
                <AlertTriangle
                  size={15}
                  className={`flex-shrink-0 mt-0.5 ${
                    simulation.outcomeType === "high_risk" ? "text-[#D65D69]" : "text-[#C98B27]"
                  }`}
                />
                <p className="text-xs leading-relaxed font-medium">
                  {simulation.warningMessage}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirmation Flow */}
        <div>
          <AnimatePresence>
            {showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-[#292641] border border-[#C98B27]/40 rounded-xl p-3.5 mb-3"
              >
                <p className="text-xs text-[#FFF4DE] font-semibold mb-1">Confirm consequential purchase?</p>
                <p className="text-xs text-[#C4C0DB] mb-3 leading-relaxed">
                  Recording {formatINR(numericAmount)} will decrease your safe daily allowance to {formatINR(a?.safeDailyAllowance || 0)}/day and projected month-end to {formatINR(a?.projectedMonthEnd || 0)}. This will immediately persist to your actual budget.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white rounded-lg py-2 text-xs font-semibold hover:from-[#6b55ed] hover:to-[#4229D3] transition-all shadow-sm disabled:opacity-50"
                  >
                    Yes, Record to Actual Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-3 bg-[#201E37] text-[#C4C0DB] border border-[#3A3656] rounded-lg py-2 text-xs font-medium hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showConfirmDialog && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!simulation || !isValidAmount || isSubmitting || confirmed}
              className={`w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                simulationMode === "unexpected"
                  ? "bg-gradient-to-r from-[#D65D69] to-[#5138EC] hover:brightness-110"
                  : "bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#6b55ed] hover:to-[#4229D3]"
              }`}
            >
              {confirmed ? (
                <>
                  <CheckCircle2 size={16} className="text-[#319A77]" />
                  Purchase Confirmed & Recorded to Budget!
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  {simulationMode === "unexpected" ? "Confirm & Record Unexpected Shock" : "Confirm & Commit Purchase"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
