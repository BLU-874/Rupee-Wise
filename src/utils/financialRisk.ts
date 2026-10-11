import type { FinancialState, FinancialMetrics, RiskLevel } from "../types/finance";
import { calculateChallengeProgress } from "./dateUtils";
import {
  clamp,
  calcAvailableBalance,
  calcTotalSpent,
  calcTotalIncome,
  calcUnpaidCommitments,
  calcRemainingSavingsReq,
  calcSpendableBalance,
  calcSafeDailyAllowance,
  calcProjectedMonthEnd,
  calcSavingsProgress,
} from "./financialMetrics";

export function calcRisk(
  projectedMonthEnd: number,
  spendableBalance: number,
  unpaidCommitments: number,
  hasEssentialUnpaid: boolean
): { level: RiskLevel; explanation: string } {
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
  // Factor 1: Liquidity (max 25)
  const liquidityRatio = clamp(availableBalance / startingBudget, 0, 1);
  const liquidityScore = Math.round(liquidityRatio * 25);

  // Factor 2: Savings progress (max 25)
  const savingsScore = Math.round((savingsProgress / 100) * 25);

  // Factor 3: Spending discipline (max 25)
  const expectedSpent = (daysElapsed / totalDays) * startingBudget;
  const actualSpent = startingBudget - availableBalance;
  const spendableRatio = clamp(spendableBalance / Math.max(1, availableBalance), 0, 1);
  const disciplineRatio = clamp((1 - (actualSpent - expectedSpent) / startingBudget) * 0.7 + spendableRatio * 0.3, 0, 1);
  const disciplineScore = Math.round(disciplineRatio * 25);

  // Factor 4: Commitment coverage (max 25)
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
