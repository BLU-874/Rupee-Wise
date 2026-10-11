import type {
  FinancialState,
  FinancialMetrics,
  RiskLevel,
  Transaction,
} from "../types/finance";
import { calculateChallengeProgress } from "./dateUtils";

// ── helpers ──────────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const formatted = abs.toLocaleString("en-IN");
  return rounded < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── core calculations ─────────────────────────────────────────────────────────

/** Total actual expenses paid (from transactions) */
export function calcTotalSpent(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Total additional income received (beyond starting budget) */
export function calcTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Available cash = starting budget + income received − expenses paid */
export function calcAvailableBalance(state: FinancialState): number {
  const spent = calcTotalSpent(state.transactions);
  const income = calcTotalIncome(state.transactions);
  return state.startingBudget + income - spent;
}

/** Sum of unpaid commitments still due within the budget period */
export function calcUnpaidCommitments(state: FinancialState): number {
  return state.commitments
    .filter((c) => c.status === "unpaid")
    .reduce((sum, c) => sum + c.amount, 0);
}

/** Remaining amount needed to reach savings goal (after savings allocated so far) */
export function calcRemainingSavingsReq(state: FinancialState): number {
  return state.savingsGoals.reduce((sum, g) => {
    const remaining = Math.max(0, g.targetAmount - g.savedAmount);
    return sum + remaining;
  }, 0);
}

/**
 * Spendable balance = available − unpaid commitments − remaining savings req.
 * Never goes below zero for display purposes.
 */
export function calcSpendableBalance(
  availableBalance: number,
  unpaidCommitments: number,
  remainingSavingsReq: number
): number {
  return Math.max(0, availableBalance - unpaidCommitments - remainingSavingsReq);
}

/**
 * Safe daily allowance = spendable / daysRemaining (min 1 day divisor).
 * Shows 0 when the underlying plan is in deficit.
 */
export function calcSafeDailyAllowance(
  spendableBalance: number,
  daysRemaining: number
): number {
  if (spendableBalance <= 0) return 0;
  return Math.floor(spendableBalance / Math.max(1, daysRemaining));
}

/**
 * Projected month-end balance:
 *   available − unpaid commitments − forecast variable spend for remaining days
 *
 * Variable spend = expenses that are NOT fixed commitments (food, transport, etc).
 * Paid commitments are excluded so they don't inflate the daily average.
 * Unpaid commitments are deducted as a lump sum — not counted in daily variable rate.
 */
export function calcProjectedMonthEnd(
  state: FinancialState,
  availableBalance: number,
  unpaidCommitments: number
): number {
  const daysElapsed = state.currentDay;
  const daysRemaining = state.totalDays - daysElapsed;

  const variableSpent = calcVariableSpent(state);
  const dailyVariableAvg = daysElapsed > 0 ? variableSpent / daysElapsed : 0;
  const forecastVariable = Math.round(dailyVariableAvg * daysRemaining);

  return availableBalance - unpaidCommitments - forecastVariable;
}

/**
 * Variable (discretionary) spend = total expenses minus any amounts that
 * correspond to already-paid fixed commitments.
 * This prevents large one-off paid bills from inflating the daily variable average.
 */
export function calcVariableSpent(state: FinancialState): number {
  const totalSpent = calcTotalSpent(state.transactions);
  const paidCommitmentTotal = state.commitments
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);
  // Clamp at 0: if somehow paid commitments exceed recorded expenses, don't go negative
  return Math.max(0, totalSpent - paidCommitmentTotal);
}

/** Savings progress percentage 0–100 */
export function calcSavingsProgress(state: FinancialState): number {
  const goal = state.savingsGoals[0];
  if (!goal || goal.targetAmount === 0) return 0;
  return clamp((goal.savedAmount / goal.targetAmount) * 100, 0, 100);
}

// ── risk & health ─────────────────────────────────────────────────────────────

export function calcRisk(
  projectedMonthEnd: number,
  spendableBalance: number,
  unpaidCommitments: number,
  hasEssentialUnpaid: boolean
): { level: RiskLevel; explanation: string } {
  // High risk: forecast goes negative, OR essential bills cannot be covered
  // by available cash (spendable already accounts for savings reservation).
  const essentialsCovered = !hasEssentialUnpaid || spendableBalance + unpaidCommitments > 0;
  if (projectedMonthEnd < 0 && !essentialsCovered) {
    return {
      level: "High",
      explanation:
        "Your projected month-end balance is negative and essential bills may go unpaid. Cut discretionary spending immediately.",
    };
  }
  if (projectedMonthEnd < 0) {
    return {
      level: "High",
      explanation:
        "At your current spending rate, your budget will run out before the month ends. Reduce variable expenses now.",
    };
  }
  if (projectedMonthEnd < 500 || spendableBalance < 300) {
    return {
      level: "Moderate",
      explanation:
        "Little buffer remains. Commitments are covered but an unexpected expense could strain your budget.",
    };
  }
  return {
    level: "Low",
    explanation:
      "Your budget is on track. Commitments are covered and there is a reasonable cash cushion.",
  };
}

export function calcHealthScore(
  availableBalance: number,
  startingBudget: number,
  savingsProgress: number,
  spendableBalance: number,
  projectedMonthEnd: number,
  unpaidCommitments: number,
  daysElapsed: number,
  totalDays: number
): { score: number; factors: { label: string; score: number; max: number }[] } {
  // Factor 1: Liquidity – how much of starting budget remains (max 25)
  const liquidityRatio = clamp(availableBalance / startingBudget, 0, 1);
  const liquidityScore = Math.round(liquidityRatio * 25);

  // Factor 2: Savings progress (max 25)
  const savingsScore = Math.round((savingsProgress / 100) * 25);

  // Factor 3: Spending discipline – spending vs expected pace, also weighted by spendable ratio (max 25)
  const expectedSpent = (daysElapsed / totalDays) * startingBudget;
  const actualSpent = startingBudget - availableBalance;
  const spendableRatio = clamp(spendableBalance / Math.max(1, availableBalance), 0, 1);
  const disciplineRatio = clamp((1 - (actualSpent - expectedSpent) / startingBudget) * 0.7 + spendableRatio * 0.3, 0, 1);
  const disciplineScore = Math.round(disciplineRatio * 25);

  // Factor 4: Commitment coverage – projected month end covers commitments (max 25)
  const coverageRatio = unpaidCommitments === 0
    ? 1
    : clamp(projectedMonthEnd / unpaidCommitments, 0, 2) / 2;
  const coverageScore = Math.round(coverageRatio * 25);

  const total = liquidityScore + savingsScore + disciplineScore + coverageScore;

  return {
    score: clamp(total, 0, 100),
    factors: [
      { label: "Liquidity", score: liquidityScore, max: 25 },
      { label: "Savings", score: savingsScore, max: 25 },
      { label: "Spending Discipline", score: disciplineScore, max: 25 },
      { label: "Commitment Coverage", score: coverageScore, max: 25 },
    ],
  };
}

// ── main metrics calculator ───────────────────────────────────────────────────

export function computeMetrics(state: FinancialState): FinancialMetrics {
  const challenge = state.periodStart
    ? calculateChallengeProgress(state.periodStart, state.totalDays)
    : { currentDay: state.currentDay, daysRemaining: Math.max(0, state.totalDays - state.currentDay) };

  const effectiveState: FinancialState = {
    ...state,
    currentDay: challenge.currentDay,
  };

  const daysRemaining = challenge.daysRemaining;
  const availableBalance = calcAvailableBalance(effectiveState);
  const totalSpent = calcTotalSpent(effectiveState.transactions);
  const totalIncome = calcTotalIncome(effectiveState.transactions);
  const unpaidCommitments = calcUnpaidCommitments(effectiveState);
  const remainingSavingsReq = calcRemainingSavingsReq(effectiveState);
  const spendableBalance = calcSpendableBalance(
    availableBalance,
    unpaidCommitments,
    remainingSavingsReq
  );
  const safeDailyAllowance = calcSafeDailyAllowance(spendableBalance, daysRemaining);
  const projectedMonthEnd = calcProjectedMonthEnd(effectiveState, availableBalance, unpaidCommitments);
  const savingsProgress = calcSavingsProgress(effectiveState);

  const hasEssentialUnpaid = effectiveState.commitments.some(
    (c) => c.status === "unpaid" && c.type === "essential"
  );
  const { level: riskLevel, explanation: riskExplanation } = calcRisk(
    projectedMonthEnd,
    spendableBalance,
    unpaidCommitments,
    hasEssentialUnpaid
  );

  const { score: healthScore, factors: healthFactors } = calcHealthScore(
    availableBalance,
    effectiveState.startingBudget,
    savingsProgress,
    spendableBalance,
    projectedMonthEnd,
    unpaidCommitments,
    effectiveState.currentDay,
    effectiveState.totalDays
  );

  return {
    availableBalance,
    totalSpent,
    totalIncome,
    unpaidCommitments,
    remainingSavingsReq,
    spendableBalance,
    safeDailyAllowance,
    projectedMonthEnd,
    savingsProgress,
    riskLevel,
    riskExplanation,
    healthScore,
    healthFactors,
    daysRemaining,
  };
}

export type SimulationOutcomeType =
  | "affordable"
  | "savings_affected"
  | "caution"
  | "high_risk";

export interface SimulationResult {
  before: FinancialMetrics;
  after: FinancialMetrics;
  feasible: boolean;
  outcomeType: SimulationOutcomeType;
  outcomeTitle: string;
  warningMessage?: string;
  impactSummary: string;
  consequenceExplanation: string;
  deltas: {
    availableBalance: number;
    spendableBalance: number;
    safeDailyAllowance: number;
    projectedMonthEnd: number;
    healthScore: number;
  };
}

export function simulatePurchase(
  state: FinancialState,
  purchaseAmount: number,
  essential: boolean,
  customCategory: string = "miscellaneous"
): SimulationResult {
  const before = computeMetrics(state);
  const sanitizedAmount = Math.max(0, Math.round(purchaseAmount));

  // Create a simulated state with the proposed purchase applied
  const simulatedState: FinancialState = {
    ...state,
    transactions: [
      ...state.transactions,
      {
        id: "__simulation__",
        date: new Date().toISOString().slice(0, 10),
        amount: sanitizedAmount,
        category: (customCategory as any) || "miscellaneous",
        description: "__simulation__",
        type: "expense",
      },
    ],
  };

  const after = computeMetrics(simulatedState);

  const deltas = {
    availableBalance: after.availableBalance - before.availableBalance,
    spendableBalance: after.spendableBalance - before.spendableBalance,
    safeDailyAllowance: after.safeDailyAllowance - before.safeDailyAllowance,
    projectedMonthEnd: after.projectedMonthEnd - before.projectedMonthEnd,
    healthScore: after.healthScore - before.healthScore,
  };

  // Evaluate honest financial outcomes
  const essentialCommitmentsTotal = state.commitments
    .filter((c) => c.status === "unpaid" && c.type === "essential")
    .reduce((s, c) => s + c.amount, 0);

  let outcomeType: SimulationOutcomeType = "affordable";
  let outcomeTitle = "Affordable within plan";
  let warningMessage: string | undefined;

  // 1. Direct cash insufficiency
  if (sanitizedAmount > before.availableBalance) {
    outcomeType = "high_risk";
    outcomeTitle = "Insufficient Available Balance";
    warningMessage = `This purchase of ${formatINR(sanitizedAmount)} exceeds your current available balance of ${formatINR(before.availableBalance)}.`;
  }
  // 2. Threatens essential commitments
  else if (after.availableBalance < essentialCommitmentsTotal) {
    outcomeType = "high_risk";
    outcomeTitle = "Essential Commitments Threatened";
    warningMessage = `After spending ${formatINR(sanitizedAmount)}, remaining balance (${formatINR(after.availableBalance)}) cannot cover upcoming essential bills (${formatINR(essentialCommitmentsTotal)}).`;
  }
  // 3. Projected month-end goes into deficit
  else if (after.projectedMonthEnd < 0) {
    outcomeType = "high_risk";
    outcomeTitle = "Deficit Month-End Forecast";
    warningMessage = `This purchase pushes your projected month-end balance to ${formatINR(after.projectedMonthEnd)}. You risk running out of cash before day 30.`;
  }
  // 4. Spendable balance drops to zero or near-zero
  else if (after.spendableBalance <= 0 && before.spendableBalance > 0) {
    outcomeType = "caution";
    outcomeTitle = "Spendable Money Exhausted";
    warningMessage = `Discretionary spendable cash drops to ₹0. Future discretionary purchases and remaining savings goals will be locked.`;
  }
  // 5. Spendable buffer is very tight
  else if (after.spendableBalance < 400) {
    outcomeType = "caution";
    outcomeTitle = "Very Limited Cash Cushion";
    warningMessage = `Spendable buffer drops to ${formatINR(after.spendableBalance)}. Any further unplanned expense will cause a budget strain.`;
  }
  // 6. Savings requirement is compromised
  else if (after.projectedMonthEnd < before.remainingSavingsReq && before.remainingSavingsReq > 0) {
    outcomeType = "savings_affected";
    outcomeTitle = "Savings Goal Progress Affected";
    warningMessage = `Purchase is affordable for bills, but month-end buffer (${formatINR(after.projectedMonthEnd)}) will fall short of your ${formatINR(before.remainingSavingsReq)} remaining savings target.`;
  }

  const feasible = outcomeType !== "high_risk";

  const consequenceExplanation = `After this purchase, your projected month-end balance decreases by ${formatINR(Math.abs(deltas.projectedMonthEnd))}. Your remaining discretionary budget is ${formatINR(after.spendableBalance)}.`;

  const impactSummary = `Balance changes by ${formatINR(Math.abs(deltas.availableBalance))}. Daily allowance: ${formatINR(before.safeDailyAllowance)} → ${formatINR(after.safeDailyAllowance)}. Month-end forecast: ${formatINR(before.projectedMonthEnd)} → ${formatINR(after.projectedMonthEnd)}.`;

  return {
    before,
    after,
    feasible,
    outcomeType,
    outcomeTitle,
    warningMessage,
    impactSummary,
    consequenceExplanation,
    deltas,
  };
}

// ── insights ──────────────────────────────────────────────────────────────────

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

// ── category breakdown ────────────────────────────────────────────────────────

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

/** Build 30-day cash flow projection for line chart.
 *
 * Past days: reconstruct actual balance from transactions.
 * Future days: project using variable-spend daily average (same rate as
 * calcProjectedMonthEnd) plus lump-sum deductions on commitment due dates.
 * This keeps the chart endpoint consistent with the KPI forecast figure.
 */
export function buildCashFlowProjection(
  state: FinancialState,
  _metrics?: FinancialMetrics
): { day: number; actual: number | null; projected: number }[] {
  const data: { day: number; actual: number | null; projected: number }[] = [];

  // Use variable-spend daily rate — same denominator as calcProjectedMonthEnd.
  // This prevents paid one-off commitments from inflating the forecast rate.
  const variableSpent = calcVariableSpent(state);
  const dailyVariableRate =
    state.currentDay > 0 ? variableSpent / state.currentDay : 0;

  let running = state.startingBudget;

  for (let day = 1; day <= state.totalDays; day++) {
    if (day <= state.currentDay) {
      // Reconstruct actual running balance up to this day
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
      // Future: deduct variable daily average + any commitment due on this exact day
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
