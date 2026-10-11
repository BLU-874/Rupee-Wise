import type { FinancialState, Transaction } from "../types/finance";

// ── formatting & math helpers ──────────────────────────────────────────────────

export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const formatted = abs.toLocaleString("en-IN");
  return rounded < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── core balance calculations ──────────────────────────────────────────────────

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
 * Variable (discretionary) spend = total expenses minus any amounts that
 * correspond to already-paid fixed commitments.
 * This prevents large one-off paid bills from inflating the daily variable average.
 */
export function calcVariableSpent(state: FinancialState): number {
  const realTransactions = state.transactions.filter(
    (t) => t.id !== "__simulation__"
  );
  const totalSpent = calcTotalSpent(realTransactions);
  const paidCommitmentTotal = state.commitments
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);
  return Math.max(0, totalSpent - paidCommitmentTotal);
}

/**
 * Projected month-end balance:
 *   available − unpaid commitments − forecast variable spend for remaining days
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

/** Savings progress percentage 0–100 */
export function calcSavingsProgress(state: FinancialState): number {
  const goal = state.savingsGoals[0];
  if (!goal || goal.targetAmount === 0) return 0;
  return clamp((goal.savedAmount / goal.targetAmount) * 100, 0, 100);
}
