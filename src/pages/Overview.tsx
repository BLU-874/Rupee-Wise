import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Activity,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import type { FinancialState, FinancialMetrics } from "../types/finance";
import BalanceCard from "../components/BalanceCard";
import MetricCard from "../components/MetricCard";
import SpendingChart from "../components/SpendingChart";
import CommitmentList from "../components/CommitmentList";
import SavingsGoalCard from "../components/SavingsGoalCard";
import { formatINR, generateInsights } from "../utils/finance";
import type { SavingsGoal } from "../types/finance";

interface OverviewProps {
  state: FinancialState;
  metrics: FinancialMetrics;
  onMarkCommitmentPaid: (id: string) => void;
  onCancelCommitment: (id: string) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onAddSavings: (goalId: string, amount: number) => void;
}

const riskColors: Record<string, string> = {
  Low: "#319A77",
  Moderate: "#C98B27",
  High: "#D65D69",
};

export default function Overview({
  state,
  metrics,
  onMarkCommitmentPaid,
  onCancelCommitment,
  onUpdateGoal,
  onAddSavings,
}: OverviewProps) {
  const insights = generateInsights(state, metrics);
  const upcomingCommitments = state.commitments
    .filter((c) => c.status !== "cancelled")
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Balance hero + 3 supporting metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <BalanceCard state={state} metrics={metrics} />
        </div>
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <MetricCard
            title="Safe Daily Allowance"
            value={formatINR(metrics.safeDailyAllowance)}
            subtitle={`Spend up to this per day for remaining ${metrics.daysRemaining} days`}
            Icon={TrendingUp}
            iconColor="#319A77"
            accent="#319A77"
            delay={0.1}
          />
          <MetricCard
            title="Month-End Forecast"
            value={formatINR(metrics.projectedMonthEnd)}
            subtitle="Projected balance after remaining bills & daily spend"
            Icon={Activity}
            iconColor={metrics.projectedMonthEnd < 500 ? "#C98B27" : "#5138EC"}
            accent={metrics.projectedMonthEnd < 500 ? "#C98B27" : "#211F35"}
            delay={0.15}
          />
          <MetricCard
            title="Financial Health"
            value={`${metrics.healthScore}/100`}
            subtitle="Liquidity, commitments coverage & savings progress"
            Icon={Target}
            iconColor={
              metrics.healthScore >= 75
                ? "#319A77"
                : metrics.healthScore >= 50
                ? "#C98B27"
                : "#D65D69"
            }
            accent={
              metrics.healthScore >= 75
                ? "#319A77"
                : metrics.healthScore >= 50
                ? "#C98B27"
                : "#D65D69"
            }
            delay={0.2}
          />
        </div>
      </div>

      {/* Charts */}
      <SpendingChart state={state} metrics={metrics} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-[#211F35] mb-3.5 flex items-center gap-2">
            <Activity size={16} className="text-[#5138EC]" />
            Financial Insights
          </h3>
          <div className="space-y-2.5">
            {insights.map((ins) => (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 rounded-xl px-3.5 py-3 border ${
                  ins.severity === "danger"
                    ? "bg-[#FCEAEC] border-[#D65D69]/30"
                    : ins.severity === "warning"
                    ? "bg-[#FFF4DE] border-[#C98B27]/30"
                    : "bg-[#EEEAFE] border-[#B6A8FF]/30"
                }`}
              >
                {ins.severity === "danger" ? (
                  <AlertCircle size={15} className="text-[#D65D69] flex-shrink-0 mt-0.5" />
                ) : ins.severity === "warning" ? (
                  <AlertTriangle size={15} className="text-[#C98B27] flex-shrink-0 mt-0.5" />
                ) : (
                  <Info size={15} className="text-[#5138EC] flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold text-[#211F35]">{ins.title}</p>
                  <p className="text-xs text-[#77748B] mt-0.5 leading-relaxed">{ins.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom grid: commitments + savings + risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Commitments */}
        <div className="md:col-span-2 rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-semibold text-[#211F35]">Upcoming Commitments</h3>
            <span className="text-xs font-medium text-[#5138EC] bg-[#EEEAFE] px-2.5 py-1 rounded-full border border-[#B6A8FF]/30 tabular-nums">
              {formatINR(metrics.unpaidCommitments)} due
            </span>
          </div>
          <CommitmentList
            commitments={upcomingCommitments}
            onMarkPaid={onMarkCommitmentPaid}
            onCancel={onCancelCommitment}
          />
        </div>

        {/* Savings goal + risk */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-[#211F35] mb-3">Savings Goal</h3>
            <SavingsGoalCard
              goals={state.savingsGoals}
              metrics={metrics}
              onUpdateGoal={onUpdateGoal}
              onAddSavings={onAddSavings}
            />
          </div>

          {/* Risk card */}
          <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-[#211F35] mb-2.5">Financial Risk</h3>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: riskColors[metrics.riskLevel] }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: riskColors[metrics.riskLevel] }}
              >
                {metrics.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-[#77748B] leading-relaxed">{metrics.riskExplanation}</p>

            {/* Health factors */}
            <div className="space-y-2 mt-3.5 pt-3 border-t border-[#EDEAF4]">
              {metrics.healthFactors.map((f) => (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#77748B]">
                    <span>{f.label}</span>
                    <span className="font-medium text-[#211F35] tabular-nums">{f.score}/{f.max}</span>
                  </div>
                  <div className="h-1.5 bg-[#EDEAF4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#5138EC]"
                      style={{ width: `${(f.score / f.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
