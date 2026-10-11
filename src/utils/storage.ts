import type { FinancialState, UserProfile } from "../types/finance";
import { getTodayLocalISO, calculateChallengeProgress, addCalendarDays } from "./dateUtils";

const STATE_STORAGE_KEY = "rupeeWise_state_v1";
const PROFILE_STORAGE_KEY = "rupeeWise_profile_v1";

// ── Profile Persistence ──────────────────────────────────────────────────────

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    console.error("Failed to save profile to localStorage");
  }
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
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
    const parsed = JSON.parse(raw) as FinancialState;

    // Safe migration: ensure periodStart exists and calculate dynamic currentDay
    const periodStart = parsed.periodStart || getTodayLocalISO();
    const totalDays = parsed.totalDays || 30;
    const { currentDay } = calculateChallengeProgress(periodStart, totalDays);

    return {
      ...parsed,
      periodStart,
      totalDays,
      currentDay,
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
