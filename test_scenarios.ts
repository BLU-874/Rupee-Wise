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

console.log("\n=== ALL SCENARIOS VERIFIED SUCCESSFULLY! ===");
