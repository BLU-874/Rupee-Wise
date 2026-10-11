import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  FinancialState,
  FinancialMetrics,
  ChallengeProgress,
  Transaction,
  Commitment,
  SavingsGoal,
  PurchaseInput,
} from "../types/finance";
import { DEMO_STATE } from "../data/demoData";
import {
  loadState,
  saveState,
  clearState,
  createNewUserFinancialState,
} from "../utils/storage";
import { computeMetrics } from "../utils/finance";
import { calculateChallengeProgress, getTodayLocalISO } from "../utils/dateUtils";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface UseFinancialStateReturn {
  state: FinancialState;
  metrics: FinancialMetrics;
  challenge: ChallengeProgress;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  confirmPurchase: (purchase: PurchaseInput) => void;
  markCommitmentPaid: (id: string) => void;
  cancelCommitment: (id: string) => void;
  addCommitment: (c: Omit<Commitment, "id">) => void;
  updateGoal: (goal: SavingsGoal) => void;
  addSavings: (goalId: string, amount: number) => void;
  addGoal: (goal: Omit<SavingsGoal, "id">) => void;
  resetDemoData: () => void;
  startNewChallenge: () => void;
  loadDemoData: () => void;
  setFinancialState: (state: FinancialState) => void;
}

export function useFinancialState(): UseFinancialStateReturn {
  const [state, setState] = useState<FinancialState>(() => {
    return loadState() || DEMO_STATE;
  });

  // Automatically persist financial state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Derived financial metrics and challenge progress
  const metrics = useMemo(() => computeMetrics(state), [state]);
  const challenge = useMemo(
    () => calculateChallengeProgress(state.periodStart, state.totalDays),
    [state.periodStart, state.totalDays]
  );

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const sanitizedAmount = Math.max(1, Math.round(tx.amount));
    const newTx: Transaction = {
      ...tx,
      amount: sanitizedAmount,
      description: tx.description.trim() || tx.category,
      id: generateId(),
    };
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
    }));
  }, []);

  const confirmPurchase = useCallback(
    (purchase: PurchaseInput) => {
      const sanitizedAmount = Math.max(1, Math.round(purchase.amount));
      const todayISO = getTodayLocalISO();
      addTransaction({
        date: todayISO,
        amount: sanitizedAmount,
        category: purchase.category,
        description: purchase.description.trim() || purchase.category,
        type: "expense",
      });
    },
    [addTransaction]
  );

  const markCommitmentPaid = useCallback((id: string) => {
    setState((prev) => {
      const commitment = prev.commitments.find((c) => c.id === id);
      if (!commitment || commitment.status !== "unpaid") return prev;

      const todayISO = getTodayLocalISO();
      const paidTx: Transaction = {
        id: generateId(),
        date: commitment.dueDate < todayISO ? commitment.dueDate : todayISO,
        amount: commitment.amount,
        category: "bills",
        description: `Bill paid: ${commitment.description}`,
        type: "expense",
      };

      return {
        ...prev,
        commitments: prev.commitments.map((c) =>
          c.id === id ? { ...c, status: "paid" as const } : c
        ),
        transactions: [...prev.transactions, paidTx],
      };
    });
  }, []);

  const cancelCommitment = useCallback((id: string) => {
    setState((prev) => {
      const commitment = prev.commitments.find((c) => c.id === id);
      if (!commitment || commitment.status !== "unpaid") return prev;

      return {
        ...prev,
        commitments: prev.commitments.map((c) =>
          c.id === id ? { ...c, status: "cancelled" as const } : c
        ),
      };
    });
  }, []);

  const addCommitment = useCallback((c: Omit<Commitment, "id">) => {
    const sanitizedAmount = Math.max(1, Math.round(c.amount));
    const newC: Commitment = {
      ...c,
      amount: sanitizedAmount,
      description: c.description.trim() || "Commitment",
      id: generateId(),
    };
    setState((prev) => ({
      ...prev,
      commitments: [...prev.commitments, newC],
    }));
  }, []);

  const updateGoal = useCallback((goal: SavingsGoal) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => (g.id === goal.id ? goal : g)),
    }));
  }, []);

  const addSavings = useCallback((goalId: string, amount: number) => {
    const sanitizedAmount = Math.max(1, Math.round(amount));
    setState((prev) => {
      const goal = prev.savingsGoals.find((g) => g.id === goalId);
      const todayISO = getTodayLocalISO();
      const newTx: Transaction = {
        id: generateId(),
        date: todayISO,
        amount: sanitizedAmount,
        category: "savings",
        description: `Saved toward: ${goal ? goal.name : "Goal"}`,
        type: "expense",
      };
      return {
        ...prev,
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === goalId
            ? { ...g, savedAmount: Math.min(g.savedAmount + sanitizedAmount, g.targetAmount) }
            : g
        ),
        transactions: [...prev.transactions, newTx],
      };
    });
  }, []);

  const addGoal = useCallback((goal: Omit<SavingsGoal, "id">) => {
    const sanitizedTarget = Math.max(100, Math.round(goal.targetAmount));
    const newG: SavingsGoal = {
      ...goal,
      targetAmount: sanitizedTarget,
      savedAmount: 0,
      id: generateId(),
    };
    setState((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newG],
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    clearState();
    setState(DEMO_STATE);
  }, []);

  const startNewChallenge = useCallback(() => {
    const fresh = createNewUserFinancialState();
    saveState(fresh);
    setState(fresh);
  }, []);

  const loadDemoData = useCallback(() => {
    saveState(DEMO_STATE);
    setState(DEMO_STATE);
  }, []);

  return {
    state,
    metrics,
    challenge,
    addTransaction,
    confirmPurchase,
    markCommitmentPaid,
    cancelCommitment,
    addCommitment,
    updateGoal,
    addSavings,
    addGoal,
    resetDemoData,
    startNewChallenge,
    loadDemoData,
    setFinancialState: setState,
  };
}
