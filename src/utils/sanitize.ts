/**
 * RupeeWise Security & Input Sanitization Utilities
 *
 * Provides safe sanitization of text inputs, bounds validation for financial figures,
 * and schema verification for data loaded from browser localStorage.
 */

import type { Category } from "../types/finance";

const ALLOWED_CATEGORIES: ReadonlySet<Category> = new Set([
  "food",
  "transport",
  "bills",
  "shopping",
  "entertainment",
  "miscellaneous",
  "savings",
  "income",
]);

/**
 * Sanitizes plain text input by stripping HTML tags, removing control characters,
 * trimming leading/trailing whitespace, and enforcing a maximum length.
 */
export function sanitizeText(input: unknown, maxLength = 120): string {
  if (typeof input !== "string") return "";

  // Strip HTML tags
  const noHtml = input.replace(/<[^>]*>/g, "");

  // Remove control characters (code points < 32 except newline/tab, and DEL 127)
  let cleanChars = "";
  for (let i = 0; i < noHtml.length; i++) {
    const code = noHtml.charCodeAt(i);
    if ((code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13) {
      cleanChars += noHtml[i];
    }
  }

  return cleanChars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes email address format.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  const cleaned = email.trim().toLowerCase().slice(0, 100);
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return emailRegex.test(cleaned) ? cleaned : "";
}

/**
 * Result returned by user-facing amount validation.
 */
export interface AmountValidationResult {
  isValid: boolean;
  amount: number;
  error?: string;
}

/**
 * Validates a user-entered transaction amount.
 * Rejects negative, zero, malformed, non-numeric, or non-finite inputs
 * instead of silently converting them to ₹1.
 */
export function validateExpenseAmount(
  raw: unknown,
  min = 1,
  max = 100_000
): AmountValidationResult {
  if (raw === undefined || raw === null || raw === "") {
    return { isValid: false, amount: 0, error: "Please enter an amount." };
  }
  const str = String(raw).trim();
  if (str === "") {
    return { isValid: false, amount: 0, error: "Please enter an amount." };
  }
  const num = Number(str);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return { isValid: false, amount: 0, error: "Please enter a valid numeric amount." };
  }
  if (num <= 0) {
    return { isValid: false, amount: 0, error: "Amount must be greater than ₹0." };
  }
  if (num < min) {
    return { isValid: false, amount: 0, error: `Amount must be at least ₹${min}.` };
  }
  if (num > max) {
    return { isValid: false, amount: 0, error: `Amount cannot exceed ₹${max.toLocaleString("en-IN")}.` };
  }
  return { isValid: true, amount: Math.round(num) };
}

/**
 * Sanitizes a financial rupee amount, enforcing positive integer bounds.
 * Used for storage persistence fallback and defensive bounding.
 */
export function sanitizeAmount(
  amount: unknown,
  min = 1,
  max = 1_000_000,
  fallback = 0
): number {
  if (typeof amount !== "number" || !Number.isFinite(amount) || Number.isNaN(amount)) {
    if (typeof amount === "string") {
      const parsed = Number(amount.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed) && !Number.isNaN(parsed)) {
        return Math.max(min, Math.min(max, Math.round(parsed)));
      }
    }
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(amount)));
}

/**
 * Validates that a string is a valid Category.
 */
export function sanitizeCategory(category: unknown, fallback: Category = "miscellaneous"): Category {
  if (typeof category === "string" && ALLOWED_CATEGORIES.has(category as Category)) {
    return category as Category;
  }
  return fallback;
}

/**
 * Validates a 'YYYY-MM-DD' calendar date string.
 */
export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}
