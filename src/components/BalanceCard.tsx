import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Calendar, IndianRupee } from "lucide-react";
import type { FinancialState, FinancialMetrics } from "../types/finance";
import { formatINR } from "../utils/finance";

interface BalanceCardProps {
  state: FinancialState;
  metrics: FinancialMetrics;
}

export default function BalanceCard({ state, metrics }: BalanceCardProps) {
  const spentPercent = Math.min(
    100,
    (metrics.totalSpent / state.startingBudget) * 100
  );
  const dayPercent = (state.currentDay / state.totalDays) * 100;
  const onTrack = spentPercent <= dayPercent + 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[#3A3656] bg-[#201E37] p-6 shadow-sm text-white"
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[#C4C0DB] text-xs font-medium tracking-wide">Available Balance</p>
            <motion.div
              key={metrics.availableBalance}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <IndianRupee size={26} className="text-[#B6A8FF]" />
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                {metrics.availableBalance.toLocaleString("en-IN")}
              </span>
            </motion.div>
            <p className="text-[#9895A9] text-xs mt-1">
              of {formatINR(state.startingBudget)} starting budget
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              onTrack
                ? "bg-[#319A77]/15 border-[#319A77]/30 text-[#319A77]"
                : "bg-[#C98B27]/15 border-[#C98B27]/30 text-[#C98B27]"
            }`}
          >
            {onTrack ? (
              <TrendingUp size={13} className="text-[#319A77]" />
            ) : (
              <TrendingDown size={13} className="text-[#C98B27]" />
            )}
            <span className="text-xs font-semibold">
              {onTrack ? "On Track" : "Over Pace"}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-[#292641] rounded-xl p-3 border border-[#3A3656]">
            <p className="text-[#C4C0DB] text-xs">Spent</p>
            <p className="text-white font-semibold text-sm mt-0.5 tabular-nums">
              {formatINR(metrics.totalSpent)}
            </p>
          </div>
          <div className="bg-[#292641] rounded-xl p-3 border border-[#3A3656]">
            <p className="text-[#C4C0DB] text-xs">Spendable</p>
            <p className="text-[#B6A8FF] font-bold text-sm mt-0.5 tabular-nums">
              {formatINR(metrics.spendableBalance)}
            </p>
          </div>
          <div className="bg-[#292641] rounded-xl p-3 border border-[#3A3656]">
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-[#C4C0DB]" />
              <p className="text-[#C4C0DB] text-xs">Challenge</p>
            </div>
            <p className="text-white font-semibold text-sm mt-0.5 tabular-nums">
              Day {state.currentDay} of {state.totalDays}
            </p>
          </div>
        </div>

        {/* Budget progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#C4C0DB]">
            <span>Budget used</span>
            <span className="font-medium text-white tabular-nums">{spentPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#292641] border border-[#3A3656] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#B6A8FF]"
            />
          </div>
          <div className="flex justify-between text-xs text-[#9895A9]">
            <span>Day progress ({dayPercent.toFixed(0)}%)</span>
            <span>{metrics.daysRemaining} days left</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
