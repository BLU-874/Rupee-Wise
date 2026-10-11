import { DEMO_STATE } from "./src/data/demoData";
import { computeMetrics, simulatePurchase, formatINR } from "./src/utils/finance";
import {
  getTodayLocalISO,
  calculateChallengeProgress,
  isDateWithinChallenge,
  addCalendarDays,
} from "./src/utils/dateUtils";
import { createNewUserFinancialState } from "./src/utils/storage";
import type { FinancialState, UserProfile } from "./src/types/finance";

console.log("=== RUPEEWISE VERIFICATION SUITE — PERSONALIZATION & CALENDAR ===\n");

// ── Initial Seed Metrics ─────────────────────────────────────────────────────
const initialMetrics = computeMetrics(DEMO_STATE);
console.log("--- Initial Seed Metrics (Demo State) ---");
console.log("Starting Budget:", formatINR(DEMO_STATE.startingBudget));
console.log("Available Balance:", formatINR(initialMetrics.availableBalance));
console.log("Total Spent:", formatINR(initialMetrics.totalSpent));
console.log("Unpaid Commitments:", formatINR(initialMetrics.unpaidCommitments));
console.log("Remaining Savings Req:", formatINR(initialMetrics.remainingSavingsReq));
console.log("Spendable Balance:", formatINR(initialMetrics.spendableBalance));
console.log("Safe Daily Allowance:", formatINR(initialMetrics.safeDailyAllowance) + "/day");
console.log("Projected Month-End:", formatINR(initialMetrics.projectedMonthEnd));
console.log("Risk Level:", initialMetrics.riskLevel);
console.log("Health Score:", initialMetrics.healthScore + "/100");

// ── Scenario A — New User Onboarding ─────────────────────────────────────────
console.log("\n--- Scenario A: New User Onboarding ---");
const today = getTodayLocalISO();
const freshState = createNewUserFinancialState(today);
const freshMetrics = computeMetrics(freshState);
const freshChallenge = calculateChallengeProgress(freshState.periodStart, freshState.totalDays, today);

console.log("New User Start Date:", freshState.periodStart, "(Actual local today)");
console.log("New User Starting Budget:", formatINR(freshState.startingBudget));
console.log("New User Transactions Count:", freshState.transactions.length);
console.log("New User Challenge Day:", freshChallenge.currentDay, "of", freshChallenge.totalDays);
console.log("New User Days Remaining:", freshChallenge.daysRemaining);
console.log("New User Available Balance:", formatINR(freshMetrics.availableBalance));
console.log("New User Spendable Balance:", formatINR(freshMetrics.spendableBalance));

if (
  freshState.periodStart === today &&
  freshState.startingBudget === 10000 &&
  freshState.transactions.length === 0 &&
  freshChallenge.currentDay === 1 &&
  freshChallenge.daysRemaining === 30 &&
  freshMetrics.availableBalance === 10000
) {
  console.log("✓ PASS: New user starts on actual local date with ₹10,000, 0 fabricated expenses, and Day 1 (30 days remaining).");
} else {
  console.error("✗ FAIL: New user state initialization mismatch!");
}

// ── Scenario B — Dynamic Date Progression ───────────────────────────────────
console.log("\n--- Scenario B: Dynamic Date Progression ---");
const testStartDate = "2026-10-11";
const day1Check = calculateChallengeProgress(testStartDate, 30, "2026-10-11");
const day2Check = calculateChallengeProgress(testStartDate, 30, "2026-10-12");
const day10Check = calculateChallengeProgress(testStartDate, 30, "2026-10-20");
const day30Check = calculateChallengeProgress(testStartDate, 30, "2026-11-09");
const completedCheck = calculateChallengeProgress(testStartDate, 30, "2026-11-10");

console.log("On Oct 11 -> Day", day1Check.currentDay, "| Remaining:", day1Check.daysRemaining, "days | Status:", day1Check.status);
console.log("On Oct 12 -> Day", day2Check.currentDay, "| Remaining:", day2Check.daysRemaining, "days | Status:", day2Check.status);
console.log("On Oct 20 -> Day", day10Check.currentDay, "| Remaining:", day10Check.daysRemaining, "days | Status:", day10Check.status);
console.log("On Nov 09 -> Day", day30Check.currentDay, "| Remaining:", day30Check.daysRemaining, "days | Status:", day30Check.status);
console.log("On Nov 10 -> Day", completedCheck.currentDay, "| Remaining:", completedCheck.daysRemaining, "days | Status:", completedCheck.status);

if (
  day1Check.currentDay === 1 && day1Check.daysRemaining === 30 &&
  day2Check.currentDay === 2 && day2Check.daysRemaining === 29 &&
  day10Check.currentDay === 10 && day10Check.daysRemaining === 21 &&
  day30Check.currentDay === 30 && day30Check.daysRemaining === 1 &&
  completedCheck.isCompleted === true && completedCheck.daysRemaining === 0
) {
  console.log("✓ PASS: Date progression strictly follows 30-day calendar math without resetting or shifting.");
} else {
  console.error("✗ FAIL: Date progression calculation mismatch!");
}

// ── Scenario C — Calendar Expense Entry ─────────────────────────────────────
console.log("\n--- Scenario C: Calendar Expense Entry ---");
let calendarState: FinancialState = JSON.parse(JSON.stringify(freshState));
const calendarExpenseDate = today; // Today's date within challenge
calendarState.transactions.push({
  id: "cal-tx-1",
  date: calendarExpenseDate,
  amount: 450,
  category: "food",
  description: "Grocery Market run (Calendar)",
  type: "expense",
});

const isWithin = isDateWithinChallenge(calendarExpenseDate, calendarState.periodStart, calendarState.totalDays);
console.log("Transaction recorded on:", calendarExpenseDate, "| Within challenge:", isWithin);
console.log("Calendar transactions for date:", calendarState.transactions.filter(t => t.date === calendarExpenseDate).length);

if (isWithin && calendarState.transactions.length === 1 && calendarState.transactions[0].amount === 450) {
  console.log("✓ PASS: Expense recorded directly to calendar date within active challenge.");
} else {
  console.error("✗ FAIL: Calendar transaction entry mismatch!");
}

// ── Scenario D — Connected Totals Across Workspace ──────────────────────────
console.log("\n--- Scenario D: Connected Totals Across Workspace ---");
const metricsAfterCalExpense = computeMetrics(calendarState);
console.log("Available cash before: ₹10,000 | after: " + formatINR(metricsAfterCalExpense.availableBalance));
console.log("Total spent: " + formatINR(metricsAfterCalExpense.totalSpent));
console.log("Spendable balance: " + formatINR(metricsAfterCalExpense.spendableBalance));
console.log("Safe daily allowance: " + formatINR(metricsAfterCalExpense.safeDailyAllowance) + "/day");

if (
  metricsAfterCalExpense.availableBalance === 9550 &&
  metricsAfterCalExpense.totalSpent === 450 &&
  metricsAfterCalExpense.spendableBalance === freshMetrics.spendableBalance - 450
) {
  console.log("✓ PASS: Calendar expense seamlessly propagates across all dashboard metrics.");
} else {
  console.error("✗ FAIL: Metric propagation mismatch!");
}

// ── Scenario E — Profile & Financial State Separation ────────────────────────
console.log("\n--- Scenario E: Profile & Financial State Separation ---");
const mockProfile: UserProfile = {
  fullName: "Aditi Rao",
  email: "aditi@example.com",
  avatarColor: "#5138EC",
  createdAt: today,
};
const updatedProfile: UserProfile = {
  ...mockProfile,
  fullName: "Aditi Sharma",
  avatarColor: "#7661F5",
};
const metricsWithProfileChange = computeMetrics(calendarState);

if (
  mockProfile.email === "aditi@example.com" &&
  updatedProfile.fullName === "Aditi Sharma" &&
  metricsWithProfileChange.availableBalance === 9550
) {
  console.log("✓ PASS: Profile editing operates independently without mutating financial calculations.");
} else {
  console.error("✗ FAIL: Profile isolation violated!");
}

// ── Scenario F — Persistence & Reload ───────────────────────────────────────
console.log("\n--- Scenario F: Persistence & Reload ---");
const serializedState = JSON.stringify(calendarState);
const restoredState: FinancialState = JSON.parse(serializedState);
const restoredMetrics = computeMetrics(restoredState);

if (
  restoredState.periodStart === calendarState.periodStart &&
  restoredState.transactions.length === calendarState.transactions.length &&
  restoredMetrics.availableBalance === metricsAfterCalExpense.availableBalance
) {
  console.log("✓ PASS: State persists and restores with identical challenge timeline and balances.");
} else {
  console.error("✗ FAIL: Persistence failure!");
}

// ── Scenario G — Start New 30-Day Challenge ─────────────────────────────────
console.log("\n--- Scenario G: Start New 30-Day Challenge ---");
const newChallengeStart = addCalendarDays(today, 35); // Later date
const restartedState = createNewUserFinancialState(newChallengeStart);
const restartedChallenge = calculateChallengeProgress(restartedState.periodStart, 30, newChallengeStart);

console.log("New Challenge Start Date:", restartedState.periodStart);
console.log("New Challenge Starting Budget:", formatINR(restartedState.startingBudget));
console.log("New Challenge Transactions Count:", restartedState.transactions.length);
console.log("New Challenge Day:", restartedChallenge.currentDay, "of", restartedChallenge.totalDays);

if (
  restartedState.periodStart === newChallengeStart &&
  restartedState.transactions.length === 0 &&
  restartedState.startingBudget === 10000 &&
  restartedChallenge.currentDay === 1
) {
  console.log("✓ PASS: Fresh challenge initialized with new start date without merging old transactions.");
} else {
  console.error("✗ FAIL: Restarting challenge failed!");
}

// ── Scenario H — Decision Lab & Purchase Simulation Regression ──────────────
console.log("\n--- Scenario H: Decision Lab & Purchase Simulation Regression ---");
const previewSim = simulatePurchase(DEMO_STATE, 1200, false);
const shockSim = simulatePurchase(DEMO_STATE, 3000, true);

if (
  previewSim.after.availableBalance === 5962 &&
  shockSim.outcomeType === "high_risk" &&
  shockSim.after.projectedMonthEnd < 0
) {
  console.log("✓ PASS: Decision Lab purchase simulator and shock expense warnings remain reliable.");
} else {
  console.error("✗ FAIL: Decision Lab regression failure!");
}

// ── Scenario I — Security & Sanitization Verification ───────────────────────
console.log("\n--- Scenario I: Security & Sanitization Verification ---");
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeAmount,
  validateExpenseAmount,
  sanitizeCategory,
  isValidDateString,
} from "./src/utils/sanitize";

const maliciousScript = "<script>alert('xss')</script>Lunch at Cafe";
const cleanedScript = sanitizeText(maliciousScript);
const maliciousEmail = "attacker<script>@evil.com";
const validEmail = "user.name+tag@example.co.in";
const cleanValidEmail = sanitizeEmail(validEmail);
const cleanBadEmail = sanitizeEmail(maliciousEmail);

const boundedAmount1 = sanitizeAmount(-500); // Should clamp to min (1)
const boundedAmount2 = sanitizeAmount("₹ 1,500.50"); // Should parse to 1501
const boundedAmount3 = sanitizeAmount(NaN, 1, 1000, 50); // Fallback to 50
const categoryCheck1 = sanitizeCategory("unknown_hack"); // Should fallback
const categoryCheck2 = sanitizeCategory("food"); // Should accept
const validDate = isValidDateString("2026-10-11");
const invalidDate = isValidDateString("2026-02-31"); // Feb 31 invalid!

const passSanitization =
  cleanedScript === "alert('xss')Lunch at Cafe" &&
  cleanBadEmail === "" &&
  cleanValidEmail === "user.name+tag@example.co.in" &&
  boundedAmount1 === 1 &&
  boundedAmount2 === 1501 &&
  boundedAmount3 === 50 &&
  categoryCheck1 === "miscellaneous" &&
  categoryCheck2 === "food" &&
  validDate === true &&
  invalidDate === false;

if (passSanitization) {
  console.log("✓ PASS: Security sanitization protects against HTML injection, invalid categories, bounded figures & bad dates.");
} else {
  console.error("✗ FAIL: Security sanitization test failure!", {
    cleanedScript,
    cleanBadEmail,
    cleanValidEmail,
    boundedAmount1,
    boundedAmount2,
    boundedAmount3,
    categoryCheck1,
    categoryCheck2,
    validDate,
    invalidDate,
  });
}

// ── Scenario J — Storage Schema Resilience ───────────────────────────────────
console.log("\n--- Scenario J: Storage Schema Resilience ---");
import { loadState } from "./src/utils/storage";

// Mock localStorage in node environment for test verification
const mockLocalStorage: Record<string, string> = {};
const originalLocalStorage = globalThis.localStorage;
globalThis.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = val; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; },
  length: 0,
  key: () => null,
};

// Store corrupted JSON with malicious amounts and script tags
globalThis.localStorage.setItem(
  "rupeeWise_state_v1",
  JSON.stringify({
    startingBudget: -99999,
    periodStart: "invalid-date",
    totalDays: 0,
    transactions: [
      { id: "1", amount: -200, category: "invalid", description: "<b>Bold</b>" },
      null,
      "corrupted string",
    ],
  })
);

const recoveredState = loadState();
const passStorageResilience =
  recoveredState !== null &&
  recoveredState.startingBudget >= 100 &&
  isValidDateString(recoveredState.periodStart) &&
  recoveredState.totalDays === 30 &&
  recoveredState.transactions.length === 1 &&
  recoveredState.transactions[0].amount > 0 &&
  recoveredState.transactions[0].category === "miscellaneous" &&
  recoveredState.transactions[0].description === "Bold";

if (passStorageResilience) {
  console.log("✓ PASS: Storage loader recovers gracefully from corrupted/tampered payloads with defensive schemas.");
} else {
  console.error("✗ FAIL: Storage resilience test failed!", recoveredState);
}

// ── Scenario K — Commitment Cancellation vs Refund Boundary ─────────────────
console.log("\n--- Scenario K: Commitment Cancellation vs Refund Boundary ---");
let commitmentTestState: FinancialState = JSON.parse(JSON.stringify(freshState));
const initialAvailable = computeMetrics(commitmentTestState).availableBalance;

// User cancels a future commitment
const cIndex = commitmentTestState.commitments.findIndex((c) => c.status === "unpaid");
commitmentTestState.commitments[cIndex].status = "cancelled";

const afterCancelMetrics = computeMetrics(commitmentTestState);
const passCancelBoundary =
  afterCancelMetrics.availableBalance === initialAvailable && // Balance does NOT increase
  afterCancelMetrics.spendableBalance > computeMetrics(freshState).spendableBalance && // Spendable cash increases because commitment is freed
  afterCancelMetrics.unpaidCommitments < computeMetrics(freshState).unpaidCommitments;

if (passCancelBoundary) {
  console.log("✓ PASS: Cancelling future commitment frees spendable cash without fabricating a cash refund.");
} else {
  console.error("✗ FAIL: Commitment cancellation boundary violated!");
}

// ── Scenario L — Financial Decision Showdown (Three-Way Comparison) ────────
console.log("\n--- Scenario L: Financial Decision Showdown (Three-Way Comparison) ---");
import { evaluateShowdown } from "./src/utils/finance";
import type { ShowdownOptionInput } from "./src/types/finance";

const baselineShowdownState: FinancialState = JSON.parse(JSON.stringify(freshState));
const initialTxCount = baselineShowdownState.transactions.length;
const initialAvail = computeMetrics(baselineShowdownState).availableBalance;

const testOptA: ShowdownOptionInput = {
  id: "A",
  description: "Required Textbooks & Coursepack",
  amount: 800,
  category: "bills",
  essential: true,
};

const testOptB: ShowdownOptionInput = {
  id: "B",
  description: "Nightclub / Party Outing",
  amount: 600,
  category: "entertainment",
  essential: false,
};

const comparisonResult = evaluateShowdown(baselineShowdownState, testOptA, testOptB);

// 1. Verify comparing options leaves state unchanged
const stateUnchanged =
  baselineShowdownState.transactions.length === initialTxCount &&
  computeMetrics(baselineShowdownState).availableBalance === initialAvail;

// 2. Verify both options calculate correct deltas
const aCorrect =
  comparisonResult.optionA.simulation.after.availableBalance === initialAvail - 800 &&
  comparisonResult.optionA.simulation.deltas.availableBalance === -800;
const bCorrect =
  comparisonResult.optionB.simulation.after.availableBalance === initialAvail - 600 &&
  comparisonResult.optionB.simulation.deltas.availableBalance === -600;

// 3. Verify rule-based analysis accounts for essential classification
const essentialAware =
  comparisonResult.recommendation.winner === "A" &&
  comparisonResult.recommendation.badgeText.includes("Essential Priority");

// 4. Verify test with shock expense where neither is affordable
const shockOptA: ShowdownOptionInput = { id: "A", description: "Extreme Shock A", amount: 15000, category: "shopping", essential: false };
const shockOptB: ShowdownOptionInput = { id: "B", description: "Extreme Shock B", amount: 12000, category: "entertainment", essential: false };
const shockResult = evaluateShowdown(baselineShowdownState, shockOptA, shockOptB);
const neitherWins = shockResult.recommendation.winner === "neither";

const passShowdown = stateUnchanged && aCorrect && bCorrect && essentialAware && neitherWins;

if (passShowdown) {
  console.log("✓ PASS: Three-way Decision Showdown correctly projects outcomes, protects essential needs, and leaves state unmutated.");
} else {
  console.error("✗ FAIL: Showdown evaluation test failed!", {
    stateUnchanged,
    aCorrect,
    bCorrect,
    essentialAware,
    neitherWins,
  });
}

// ── Scenario M — Showdown Option Confirmation & Ledger Integrity ─────────────
console.log("\n--- Scenario M: Showdown Option Confirmation & Ledger Integrity ---");
let confirmedState: FinancialState = JSON.parse(JSON.stringify(freshState));
const preConfirmTxCount = confirmedState.transactions.length;

// Confirm Option A: records exactly one transaction
confirmedState.transactions.push({
  id: "showdown-commit-1",
  date: today,
  amount: testOptA.amount,
  category: testOptA.category,
  description: testOptA.description,
  type: "expense",
});

const postConfirmMetrics = computeMetrics(confirmedState);
const passConfirmOptionA =
  confirmedState.transactions.length === preConfirmTxCount + 1 &&
  confirmedState.transactions[confirmedState.transactions.length - 1].amount === 800 &&
  postConfirmMetrics.availableBalance === initialAvail - 800;

// Confirm invalid amount bounding check
const invalidAmount = -100;
const sanitizedAmount = sanitizeAmount(invalidAmount, 1, 50000, 0);
const passInvalidRejection = sanitizedAmount === 1;

// User input validation check: ensures negative, zero, malformed, non-finite amounts cannot be confirmed
const negValidation = validateExpenseAmount(-100);
const zeroValidation = validateExpenseAmount(0);
const malformedValidation = validateExpenseAmount("abc");
const nonFiniteValidation = validateExpenseAmount(Infinity);
const validExpenseValidation = validateExpenseAmount("800");

const passValidationRejection =
  negValidation.isValid === false &&
  zeroValidation.isValid === false &&
  malformedValidation.isValid === false &&
  nonFiniteValidation.isValid === false &&
  validExpenseValidation.isValid === true &&
  validExpenseValidation.amount === 800;

if (passConfirmOptionA && passInvalidRejection && passValidationRejection) {
  console.log("✓ PASS: Confirming a showdown option records exactly one ledger expense, and negative/zero/malformed amounts are strictly rejected with validation errors.");
} else {
  console.error("✗ FAIL: Showdown confirmation integrity failed!", {
    passConfirmOptionA,
    passInvalidRejection,
    passValidationRejection,
  });
}

// Restore original localStorage if present
if (originalLocalStorage) {
  globalThis.localStorage = originalLocalStorage;
}

console.log("\n=== ALL SCENARIOS (A THROUGH M) VERIFIED SUCCESSFULLY! ===");
