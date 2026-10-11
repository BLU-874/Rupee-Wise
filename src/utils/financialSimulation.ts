import type {
  FinancialState,
  Category,
  SimulationResult,
  ShowdownOptionInput,
  ShowdownComparisonResult,
} from "../types/finance";
import { formatINR } from "./financialMetrics";
import { computeMetrics } from "./financialRisk";

export type SimulationOutcomeType =
  | "affordable"
  | "savings_affected"
  | "caution"
  | "high_risk";

export function simulatePurchase(
  state: FinancialState,
  purchaseAmount: number,
  _essential: boolean = false,
  customCategory: string = "miscellaneous"
): SimulationResult {
  const before = computeMetrics(state);
  const sanitizedAmount =
    typeof purchaseAmount === "number" &&
    Number.isFinite(purchaseAmount) &&
    !Number.isNaN(purchaseAmount)
      ? Math.max(0, Math.min(100_000_000, Math.round(purchaseAmount)))
      : 0;

  // Create simulated state with the proposed purchase applied
  const simulatedState: FinancialState = {
    ...state,
    transactions: [
      ...state.transactions,
      {
        id: "__simulation__",
        date: new Date().toISOString().slice(0, 10),
        amount: sanitizedAmount,
        category: (customCategory as Category) || "miscellaneous",
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

/**
 * Evaluates a three-way Financial Decision Showdown between the Current Financial State,
 * Option A, and Option B without modifying actual state.
 */
export function evaluateShowdown(
  state: FinancialState,
  optA: ShowdownOptionInput,
  optB: ShowdownOptionInput
): ShowdownComparisonResult {
  const current = computeMetrics(state);
  const simA = simulatePurchase(state, optA.amount, optA.essential, optA.category);
  const simB = simulatePurchase(state, optB.amount, optB.essential, optB.category);

  const diffSpendable = Math.abs(simA.after.spendableBalance - simB.after.spendableBalance);

  let winner: "A" | "B" | "neither" | "tie" = "tie";
  let badgeText = "Balanced Trade-Off";
  let headline = "Both choices offer comparable financial standing";
  let analysis = "";

  const aFeasible = simA.feasible;
  const bFeasible = simB.feasible;

  // Case 1: Both options carry high risk or deficit forecast
  if (!aFeasible && !bFeasible) {
    winner = "neither";
    badgeText = "Neither Recommended";
    headline = "Both options threaten essential obligations or cause month-end deficits";
    analysis = `Option A (${formatINR(optA.amount)}) and Option B (${formatINR(optB.amount)}) both degrade your plan into high risk. Option A leaves ₹${simA.after.projectedMonthEnd} while Option B leaves ₹${simB.after.projectedMonthEnd}. We recommend postponing both purchases until your spendable cushion recovers.`;
  }
  // Case 2: Only Option A is viable
  else if (aFeasible && !bFeasible) {
    winner = "A";
    badgeText = "Option A Recommended";
    headline = `Option A preserves stability, while Option B creates critical budget risk`;
    analysis = `Option A (${optA.description}) is financially sustainable and leaves ${formatINR(simA.after.spendableBalance)} spendable. Option B (${optB.description}) triggers ${simB.outcomeTitle} and drops month-end projection into deficit.`;
  }
  // Case 3: Only Option B is viable
  else if (!aFeasible && bFeasible) {
    winner = "B";
    badgeText = "Option B Recommended";
    headline = `Option B preserves stability, while Option A creates critical budget risk`;
    analysis = `Option B (${optB.description}) remains within budget discipline (${formatINR(simB.after.spendableBalance)} spendable). Option A (${optA.description}) threatens essential bills or savings targets.`;
  }
  // Case 4: Both are viable — nuance by essential vs discretionary classification
  else {
    // Subcase 4a: One is essential necessity and one is discretionary luxury
    if (optA.essential && !optB.essential) {
      if (optA.amount <= optB.amount || simA.after.spendableBalance >= 400) {
        winner = "A";
        badgeText = "Option A (Essential Priority)";
        headline = `Option A addresses an essential obligation without endangering budget solvency`;
        analysis = `Although Option B is discretionary, Option A (${optA.description}) fulfills an essential need while preserving a safe daily allowance of ${formatINR(simA.after.safeDailyAllowance)}/day and ₹${simA.after.spendableBalance} spendable cushion.`;
      } else {
        winner = "B";
        badgeText = "Option B (Discretionary Buffer)";
        headline = `Option B preserves significantly higher cash cushion (${formatINR(diffSpendable)} more)`;
        analysis = `While Option A is marked essential, its cost of ${formatINR(optA.amount)} severely depletes your spendable reserve. Option B preserves ${formatINR(simB.after.spendableBalance)} spendable runway.`;
      }
    } else if (!optA.essential && optB.essential) {
      if (optB.amount <= optA.amount || simB.after.spendableBalance >= 400) {
        winner = "B";
        badgeText = "Option B (Essential Priority)";
        headline = `Option B addresses an essential obligation without endangering budget solvency`;
        analysis = `Option B (${optB.description}) fulfills an essential obligation while keeping health score at ${simB.after.healthScore}/100 and safe daily allowance at ${formatINR(simB.after.safeDailyAllowance)}/day.`;
      } else {
        winner = "A";
        badgeText = "Option A (Preserves Liquidity)";
        headline = `Option A leaves a stronger cash cushion (${formatINR(diffSpendable)} higher spendable balance)`;
        analysis = `Option A preserves ${formatINR(simA.after.spendableBalance)} in spendable funds, providing greater flexibility against unexpected living expenses.`;
      }
    }
    // Subcase 4b: Both have same classification (both essential or both discretionary)
    else {
      if (simA.after.healthScore > simB.after.healthScore || optA.amount < optB.amount) {
        winner = "A";
        badgeText = "Option A Preserves Plan Better";
        headline = `Option A retains ${formatINR(diffSpendable)} more in discretionary runway`;
        analysis = `Option A (${formatINR(optA.amount)}) maintains a higher health score (${simA.after.healthScore} vs ${simB.after.healthScore}) and leaves ${formatINR(simA.after.safeDailyAllowance)}/day vs ${formatINR(simB.after.safeDailyAllowance)}/day for remaining days.`;
      } else if (simB.after.healthScore > simA.after.healthScore || optB.amount < optA.amount) {
        winner = "B";
        badgeText = "Option B Preserves Plan Better";
        headline = `Option B retains ${formatINR(diffSpendable)} more in discretionary runway`;
        analysis = `Option B (${formatINR(optB.amount)}) maintains a higher health score (${simB.after.healthScore} vs ${simA.after.healthScore}) and leaves ${formatINR(simB.after.safeDailyAllowance)}/day vs ${formatINR(simA.after.safeDailyAllowance)}/day for remaining days.`;
      } else {
        winner = "tie";
        badgeText = "Equivalent Impact";
        headline = "Both options have identical financial impact on your plan";
        analysis = `Both choices result in identical cash-flow adjustments (${formatINR(optA.amount)}), leaving ${formatINR(simA.after.spendableBalance)} spendable balance.`;
      }
    }
  }

  return {
    current,
    optionA: {
      option: optA,
      simulation: simA,
    },
    optionB: {
      option: optB,
      simulation: simB,
    },
    recommendation: {
      winner,
      badgeText,
      headline,
      analysis,
      savingsPreservedDiff: diffSpendable,
    },
  };
}
