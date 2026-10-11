export type Category =
  | "food"
  | "transport"
  | "bills"
  | "shopping"
  | "entertainment"
  | "miscellaneous"
  | "savings"
  | "income";

export type CommitmentStatus = "paid" | "unpaid" | "cancelled";
export type CommitmentType = "essential" | "discretionary";
export type RiskLevel = "Low" | "Moderate" | "High";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: Category;
  description: string;
  type: "expense" | "income";
}

export interface Commitment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: CommitmentStatus;
  type: CommitmentType;
  recurring?: boolean;
  recurrenceTag?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  monthlyContribution: number;
  icon?: string;
}

export interface FinancialState {
  startingBudget: number;
  currentDay: number;
  totalDays: number;
  periodStart: string;
  transactions: Transaction[];
  commitments: Commitment[];
  savingsGoals: SavingsGoal[];
}

export interface FinancialMetrics {
  availableBalance: number;
  totalSpent: number;
  totalIncome: number;
  unpaidCommitments: number;
  remainingSavingsReq: number;
  spendableBalance: number;
  safeDailyAllowance: number;
  projectedMonthEnd: number;
  savingsProgress: number;
  riskLevel: RiskLevel;
  riskExplanation: string;
  healthScore: number;
  healthFactors: { label: string; score: number; max: number }[];
  daysRemaining: number;
}

export interface SimulationResult {
  before: FinancialMetrics;
  after: FinancialMetrics;
  feasible: boolean;
  outcomeType: "affordable" | "savings_affected" | "caution" | "high_risk";
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

export interface PurchaseInput {
  amount: number;
  description: string;
  category: Category;
  essential: boolean;
}

export type Page =
  | "overview"
  | "transactions"
  | "decisionlab"
  | "savings"
  | "commitments"
  | "calendar";

export interface UserProfile {
  fullName: string;
  email: string;
  avatarColor: string;
  createdAt: string;
}

export interface ChallengeProgress {
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  daysRemaining: number;
  timeProgressPercent: number;
  isCompleted: boolean;
  status: "active" | "completed" | "upcoming";
}

export interface ShowdownOptionInput {
  id: "A" | "B";
  description: string;
  amount: number;
  category: Category;
  essential: boolean;
}

export interface ShowdownOptionEvaluation {
  option: ShowdownOptionInput;
  simulation: SimulationResult;
}

export interface ShowdownComparisonResult {
  current: FinancialMetrics;
  optionA: ShowdownOptionEvaluation;
  optionB: ShowdownOptionEvaluation;
  recommendation: {
    winner: "A" | "B" | "neither" | "tie";
    badgeText: string;
    headline: string;
    analysis: string;
    savingsPreservedDiff: number;
  };
}
