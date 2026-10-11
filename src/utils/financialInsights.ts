import type { FinancialState, FinancialMetrics, Transaction } from "../types/finance";
import { formatINR, calcVariableSpent } from "./financialMetrics";

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#7661F5",
  transport: "#5138EC",
  bills: "#C98B27",
  shopping: "#B6A8FF",
  entertainment: "#D65D69",
  miscellaneous: "#77748B",
  savings: "#319A77",
  income: "#319A77",
};

export function generateInsights(
  state: FinancialState,
  metrics: FinancialMetrics
): { id: string; title: string; body: string; severity: "info" | "warning" | "danger" }[] {
  const insights: { id: string; title: string; body: string; severity: "info" | "warning" | "danger" }[] = [];

  const expectedSpent = (state.currentDay / state.totalDays) * state.startingBudget;
  if (metrics.totalSpent > expectedSpent * 1.1) {
    insights.push({
      id: "overspending",
      title: "Spending above planned pace",
      body: `You've spent ${formatINR(metrics.totalSpent)} by day ${state.currentDay}, but the planned pace suggests ${formatINR(Math.round(expectedSpent))}. Consider reducing discretionary expenses.`,
      severity: "warning",
    });
  }

  if (metrics.projectedMonthEnd < 500) {
    insights.push({
      id: "low-projection",
      title: "Month-end projection is low",
      body: `At your current spending rate, you may end the month with only ${formatINR(metrics.projectedMonthEnd)}. Cutting a subscription or reducing dining out could help significantly.`,
      severity: metrics.projectedMonthEnd < 0 ? "danger" : "warning",
    });
  }

  const nextCommitment = state.commitments
    .filter((c) => c.status === "unpaid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  if (nextCommitment) {
    const daysUntil = Math.ceil(
      (new Date(nextCommitment.dueDate).getTime() - Date.now()) / 86400000
    );
    if (daysUntil <= 5 && daysUntil >= 0) {
      insights.push({
        id: "upcoming-bill",
        title: `${nextCommitment.description} due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
        body: `${formatINR(nextCommitment.amount)} will be deducted soon. Your spendable balance after this payment will be ${formatINR(metrics.spendableBalance - nextCommitment.amount)}.`,
        severity: nextCommitment.type === "essential" ? "warning" : "info",
      });
    }
  }

  const goal = state.savingsGoals[0];
  if (goal && metrics.savingsProgress < 50 && state.currentDay >= 15) {
    insights.push({
      id: "savings-behind",
      title: "Savings goal may be missed",
      body: `You are ${metrics.savingsProgress.toFixed(0)}% toward your "${goal.name}" goal. Adding ${formatINR(goal.monthlyContribution)} this month would help you stay on track.`,
      severity: "warning",
    });
  }

  if (metrics.healthScore >= 75) {
    insights.push({
      id: "healthy",
      title: "Your finances look healthy",
      body: `Health score of ${metrics.healthScore}/100. Commitments are covered, savings are on track, and you have a comfortable daily allowance of ${formatINR(metrics.safeDailyAllowance)}.`,
      severity: "info",
    });
  }

  return insights;
}

export function getCategoryBreakdown(
  transactions: Transaction[]
): { name: string; value: number; color: string }[] {
  const map: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#9DB0C3",
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildCashFlowProjection(
  state: FinancialState,
  _metrics?: FinancialMetrics
): { day: number; actual: number | null; projected: number }[] {
  const data: { day: number; actual: number | null; projected: number }[] = [];

  const variableSpent = calcVariableSpent(state);
  const dailyVariableRate =
    state.currentDay > 0 ? variableSpent / state.currentDay : 0;

  let running = state.startingBudget;

  for (let day = 1; day <= state.totalDays; day++) {
    if (day <= state.currentDay) {
      const spent = state.transactions
        .filter((t) => {
          const d = new Date(t.date);
          const start = new Date(state.periodStart);
          const target = new Date(start);
          target.setDate(start.getDate() + day - 1);
          return t.type === "expense" && d <= target;
        })
        .reduce((s, t) => s + t.amount, 0);
      const income = state.transactions
        .filter((t) => {
          const d = new Date(t.date);
          const start = new Date(state.periodStart);
          const target = new Date(start);
          target.setDate(start.getDate() + day - 1);
          return t.type === "income" && d <= target;
        })
        .reduce((s, t) => s + t.amount, 0);
      running = state.startingBudget + income - spent;
      data.push({ day, actual: running, projected: running });
    } else {
      const commitmentDue = state.commitments
        .filter((c) => {
          if (c.status !== "unpaid") return false;
          const due = new Date(c.dueDate);
          const start = new Date(state.periodStart);
          const target = new Date(start);
          target.setDate(start.getDate() + day - 1);
          return due.toDateString() === target.toDateString();
        })
        .reduce((s, c) => s + c.amount, 0);
      running = running - dailyVariableRate - commitmentDue;
      data.push({ day, actual: null, projected: Math.round(running) });
    }
  }
  return data;
}
