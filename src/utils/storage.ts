import type {
  FinancialState,
  UserProfile,
  Transaction,
  Commitment,
  SavingsGoal,
} from "../types/finance";
import { getTodayLocalISO, calculateChallengeProgress, addCalendarDays } from "./dateUtils";
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeAmount,
  sanitizeCategory,
  isValidDateString,
} from "./sanitize";

const STATE_STORAGE_KEY = "rupeeWise_state_v1";
const PROFILE_STORAGE_KEY = "rupeeWise_profile_v1";

// ── Profile Persistence ──────────────────────────────────────────────────────

export function saveProfile(profile: UserProfile): void {
  try {
    const sanitized: UserProfile = {
      fullName: sanitizeText(profile.fullName, 50) || "Member",
      email: sanitizeEmail(profile.email) || profile.email,
      avatarColor: sanitizeText(profile.avatarColor, 30) || "#5138EC",
      createdAt: isValidDateString(profile.createdAt) ? profile.createdAt : getTodayLocalISO(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    console.error("Failed to save profile to localStorage");
  }
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      fullName: sanitizeText(parsed.fullName || parsed.name, 50) || "Member",
      email: sanitizeEmail(parsed.email) || "",
      avatarColor: sanitizeText(parsed.avatarColor, 30) || "#5138EC",
      createdAt: isValidDateString(parsed.createdAt || parsed.joinedDate)
        ? (parsed.createdAt || parsed.joinedDate)
        : getTodayLocalISO(),
    };
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    console.error("Failed to clear profile from localStorage");
  }
}

// ── Financial State Persistence & Safe Migration ─────────────────────────────

export function saveState(state: FinancialState): void {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Failed to save state to localStorage");
  }
}

export function loadState(): FinancialState | null {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // Validate periodStart & totalDays
    const periodStart = isValidDateString(parsed.periodStart)
      ? parsed.periodStart
      : getTodayLocalISO();
    const totalDays = typeof parsed.totalDays === "number" && parsed.totalDays > 0 && parsed.totalDays <= 365
      ? Math.round(parsed.totalDays)
      : 30;

    const { currentDay } = calculateChallengeProgress(periodStart, totalDays);

    // Validate transactions array
    const rawTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const validTransactions: Transaction[] = rawTransactions
      .map((t: unknown): Transaction | null => {
        if (!t || typeof t !== "object") return null;
        const item = t as Record<string, unknown>;
        return {
          id: sanitizeText(item.id, 50) || `tx-${Math.random().toString(36).slice(2, 8)}`,
          date: isValidDateString(item.date) ? (item.date as string) : periodStart,
          amount: sanitizeAmount(item.amount, 1, 1_000_000, 10),
          category: sanitizeCategory(item.category, "miscellaneous"),
          description: sanitizeText(item.description, 100) || "Expense",
          type: item.type === "income" ? "income" : "expense",
        };
      })
      .filter((t: Transaction | null): t is Transaction => t !== null);

    // Validate commitments array
    const rawCommitments = Array.isArray(parsed.commitments) ? parsed.commitments : [];
    const validCommitments: Commitment[] = rawCommitments
      .map((c: unknown): Commitment | null => {
        if (!c || typeof c !== "object") return null;
        const item = c as Record<string, unknown>;
        const validStatuses: Commitment["status"][] = ["paid", "unpaid", "cancelled"];
        const status = typeof item.status === "string" && validStatuses.includes(item.status as Commitment["status"])
          ? (item.status as Commitment["status"])
          : "unpaid";
        const type: Commitment["type"] = item.type === "discretionary" ? "discretionary" : "essential";
        return {
          id: sanitizeText(item.id, 50) || `c-${Math.random().toString(36).slice(2, 8)}`,
          description: sanitizeText(item.description, 100) || "Commitment",
          amount: sanitizeAmount(item.amount, 1, 1_000_000, 100),
          dueDate: isValidDateString(item.dueDate) ? (item.dueDate as string) : periodStart,
          status,
          type,
          recurring: Boolean(item.recurring),
          recurrenceTag: typeof item.recurrenceTag === "string" ? sanitizeText(item.recurrenceTag, 40) : undefined,
        };
      })
      .filter((c: Commitment | null): c is Commitment => c !== null);

    // Validate savings goals array
    const rawGoals = Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [];
    const validGoals: SavingsGoal[] = rawGoals
      .map((g: unknown): SavingsGoal | null => {
        if (!g || typeof g !== "object") return null;
        const item = g as Record<string, unknown>;
        return {
          id: sanitizeText(item.id, 50) || `sg-${Math.random().toString(36).slice(2, 8)}`,
          name: sanitizeText(item.name, 80) || "Savings Goal",
          targetAmount: sanitizeAmount(item.targetAmount, 1, 10_000_000, 1000),
          savedAmount: typeof item.savedAmount === "number" && item.savedAmount >= 0 ? Math.round(item.savedAmount) : 0,
          targetDate: isValidDateString(item.targetDate) ? (item.targetDate as string) : addCalendarDays(periodStart, 29),
          monthlyContribution: sanitizeAmount(item.monthlyContribution, 0, 1_000_000, 500),
          icon: typeof item.icon === "string" ? sanitizeText(item.icon, 30) : undefined,
        };
      })
      .filter((g: SavingsGoal | null): g is SavingsGoal => g !== null);

    const startingBudget = sanitizeAmount(parsed.startingBudget, 100, 10_000_000, 10000);

    return {
      startingBudget,
      periodStart,
      totalDays,
      currentDay,
      transactions: validTransactions,
      commitments: validCommitments,
      savingsGoals: validGoals,
    };
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STATE_STORAGE_KEY);
  } catch {
    console.error("Failed to clear state from localStorage");
  }
}

/**
 * Creates a fresh, personal financial state for a newly onboarded user.
 * - Starts on user's current local date.
 * - Starting budget: ₹10,000.
 * - 0 fabricated expenses.
 * - Realistic starter commitments and savings goal.
 */
export function createNewUserFinancialState(startDate?: string): FinancialState {
  const start = startDate || getTodayLocalISO();
  return {
    startingBudget: 10000,
    currentDay: 1,
    totalDays: 30,
    periodStart: start,
    transactions: [],
    commitments: [
      {
        id: "c-rent",
        description: "Room / Hostel Rent",
        amount: 2500,
        dueDate: addCalendarDays(start, 5),
        status: "unpaid",
        type: "essential",
      },
      {
        id: "c-phone",
        description: "Mobile Recharge & Data",
        amount: 299,
        dueDate: addCalendarDays(start, 12),
        status: "unpaid",
        type: "essential",
      },
      {
        id: "c-wifi",
        description: "Broadband / WiFi Share",
        amount: 350,
        dueDate: addCalendarDays(start, 18),
        status: "unpaid",
        type: "essential",
      },
    ],
    savingsGoals: [
      {
        id: "sg-emergency",
        name: "Emergency Fund",
        targetAmount: 2000,
        savedAmount: 0,
        targetDate: addCalendarDays(start, 29),
        monthlyContribution: 2000,
      },
    ],
  };
}
