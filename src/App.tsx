import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RotateCcw, Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import HeroSection from "./components/HeroSection";
import Overview from "./pages/Overview";
import CalendarPage from "./pages/CalendarPage";
import Transactions from "./pages/Transactions";
import DecisionLab from "./pages/DecisionLab";
import SavingsGoals from "./pages/SavingsGoals";
import Commitments from "./pages/Commitments";
import OnboardingModal from "./components/OnboardingModal";
import ProfileModal from "./components/ProfileModal";
import { DEMO_STATE, DEMO_PROFILE } from "./data/demoData";
import {
  loadState,
  saveState,
  clearState,
  loadProfile,
  saveProfile,
  clearProfile,
  createNewUserFinancialState,
} from "./utils/storage";
import { computeMetrics } from "./utils/finance";
import { calculateChallengeProgress, getTodayLocalISO } from "./utils/dateUtils";
import type {
  FinancialState,
  Transaction,
  Commitment,
  SavingsGoal,
  PurchaseInput,
  UserProfile,
  Page,
} from "./types/finance";

const PAGE_TITLES: Record<Page, string> = {
  overview: "Overview",
  calendar: "Financial Calendar",
  transactions: "Transactions",
  decisionlab: "Decision Lab",
  savings: "Savings Goals",
  commitments: "Commitments",
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return loadProfile();
  });

  const [state, setState] = useState<FinancialState>(() => {
    const saved = loadState();
    return saved ?? DEMO_STATE;
  });

  const [activePage, setActivePage] = useState<Page>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Persist financial state on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const metrics = computeMetrics(state);
  const challenge = calculateChallengeProgress(state.periodStart, state.totalDays);

  // ── mutation helpers ──────────────────────────────────────────────────────

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const sanitizedAmount = Math.max(1, Math.round(tx.amount));
    setState((s) => ({
      ...s,
      transactions: [
        ...s.transactions,
        {
          ...tx,
          amount: sanitizedAmount,
          description: tx.description.trim() || tx.category,
          id: generateId(),
        },
      ],
    }));
  }, []);

  const confirmPurchase = useCallback((purchase: PurchaseInput) => {
    const sanitizedAmount = Math.max(1, Math.round(purchase.amount));
    addTransaction({
      amount: sanitizedAmount,
      category: purchase.category,
      description: purchase.description.trim() || purchase.category,
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
    });
  }, [addTransaction]);

  const markCommitmentPaid = useCallback((id: string) => {
    setState((s) => {
      const commitment = s.commitments.find((c) => c.id === id);
      if (!commitment || commitment.status !== "unpaid") return s;

      const updatedCommitments = s.commitments.map((c) =>
        c.id === id ? { ...c, status: "paid" as const } : c
      );

      // Record corresponding bill payment transaction exactly once
      const paidTx: Transaction = {
        id: generateId(),
        date: new Date().toISOString().slice(0, 10),
        amount: commitment.amount,
        category: "bills",
        description: commitment.description,
        type: "expense",
      };

      return {
        ...s,
        commitments: updatedCommitments,
        transactions: [...s.transactions, paidTx],
      };
    });
  }, []);

  const cancelCommitment = useCallback((id: string) => {
    setState((s) => {
      const commitment = s.commitments.find((c) => c.id === id);
      if (!commitment || commitment.status !== "unpaid") return s;

      return {
        ...s,
        commitments: s.commitments.map((c) =>
          c.id === id ? { ...c, status: "cancelled" as const } : c
        ),
      };
    });
  }, []);

  const addCommitment = useCallback((c: Omit<Commitment, "id">) => {
    const sanitizedAmount = Math.max(1, Math.round(c.amount));
    setState((s) => ({
      ...s,
      commitments: [
        ...s.commitments,
        {
          ...c,
          amount: sanitizedAmount,
          description: c.description.trim() || "Commitment",
          id: generateId(),
        },
      ],
    }));
  }, []);

  const updateGoal = useCallback((goal: SavingsGoal) => {
    setState((s) => ({
      ...s,
      savingsGoals: s.savingsGoals.map((g) => (g.id === goal.id ? goal : g)),
    }));
  }, []);

  const addSavings = useCallback((goalId: string, amount: number) => {
    const sanitizedAmount = Math.max(1, Math.round(amount));
    setState((s) => ({
      ...s,
      savingsGoals: s.savingsGoals.map((g) =>
        g.id === goalId
          ? { ...g, savedAmount: Math.min(g.savedAmount + sanitizedAmount, g.targetAmount) }
          : g
      ),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<SavingsGoal, "id">) => {
    const sanitizedTarget = Math.max(100, Math.round(goal.targetAmount));
    setState((s) => ({
      ...s,
      savingsGoals: [
        ...s.savingsGoals,
        {
          ...goal,
          targetAmount: sanitizedTarget,
          savedAmount: 0,
          id: generateId(),
        },
      ],
    }));
  }, []);

  // ── onboarding & profile handlers ──────────────────────────────────────────

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
    const freshState = createNewUserFinancialState();
    saveState(freshState);
    setState(freshState);
    setShowOnboarding(false);
    scrollToWorkspace();
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleStartNewChallenge = () => {
    const today = getTodayLocalISO();
    const freshState = createNewUserFinancialState(today);
    saveState(freshState);
    setState(freshState);
  };

  const handleLoadDemoData = () => {
    saveProfile(DEMO_PROFILE);
    setProfile(DEMO_PROFILE);
    saveState(DEMO_STATE);
    setState(DEMO_STATE);
  };

  const handleResetProfile = () => {
    clearProfile();
    setProfile(null);
    clearState();
    setState(createNewUserFinancialState());
  };

  function handleResetDemoData() {
    clearState();
    setState(DEMO_STATE);
    setShowReset(false);
  }

  function handleNavigate(page: Page) {
    setActivePage(page);
    setMobileOpen(false);
  }

  const scrollToWorkspace = useCallback(() => {
    const el = document.getElementById("workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const userDisplayName = profile?.fullName
    ? profile.fullName.trim().split(" ")[0]
    : "Explorer";

  const userInitials = profile?.fullName
    ? profile.fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "RW";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F6FC] text-[#211F35] scroll-smooth">
      {/* ── 1. Full-Screen Cinematic Introductory Hero ── */}
      <HeroSection
        state={state}
        metrics={metrics}
        profile={profile}
        onNavigate={handleNavigate}
        onScrollToWorkspace={scrollToWorkspace}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* ── 2. Interactive Financial Workspace ── */}
      <div id="workspace" className="flex min-h-screen bg-[#F7F6FC] relative">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((o) => !o)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 border-b border-[#E8E5F0] bg-white/95 backdrop-blur-md flex-shrink-0">
            <div>
              <p className="text-xs text-[#77748B]">
                {getGreeting()}, {userDisplayName} 👋 · Day {challenge.currentDay} of {state.totalDays}
              </p>
              <h1 className="text-base font-bold text-[#211F35] tracking-tight">
                {PAGE_TITLES[activePage]}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Day progress pill */}
              <div className="hidden sm:flex items-center gap-2 bg-[#F0EEFA] border border-[#E8E5F0] rounded-full px-3 py-1">
                <div className="w-16 h-1.5 bg-[#EDEAF4] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#5138EC]"
                    style={{ width: `${challenge.timeProgressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#5138EC]">
                  Day {challenge.currentDay}/{state.totalDays}
                </span>
              </div>

              {/* Profile Avatar Trigger or Onboarding Trigger */}
              {profile ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7F6FC] hover:bg-[#F0EEFA] border border-[#E8E5F0] text-xs font-medium text-[#211F35] transition-all"
                  title="Profile & Challenge Settings"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: profile.avatarColor || "#5138EC" }}
                  >
                    {userInitials}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold">{userDisplayName}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="px-3 py-1 rounded-full bg-[#EEEAFE] hover:bg-[#E3DCFE] text-[#5138EC] text-xs font-semibold border border-[#5138EC]/20 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles size={13} />
                  <span>Onboard</span>
                </button>
              )}

              {/* Notification placeholder */}
              <button
                className="w-8 h-8 rounded-lg bg-[#F7F6FC] border border-[#E8E5F0] flex items-center justify-center text-[#77748B] hover:text-[#5138EC] hover:bg-white transition-colors"
                title="Notifications"
              >
                <Bell size={15} />
              </button>

              {/* Reset Demo Data */}
              <button
                onClick={() => setShowReset(true)}
                className="w-8 h-8 rounded-lg bg-[#F7F6FC] border border-[#E8E5F0] flex items-center justify-center text-[#77748B] hover:text-[#D65D69] hover:bg-white transition-colors"
                title="Reset demo data"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activePage === "overview" && (
                  <Overview
                    state={state}
                    metrics={metrics}
                    onMarkCommitmentPaid={markCommitmentPaid}
                    onCancelCommitment={cancelCommitment}
                    onUpdateGoal={updateGoal}
                    onAddSavings={addSavings}
                  />
                )}
                {activePage === "calendar" && (
                  <CalendarPage
                    state={state}
                    onAddTransaction={addTransaction}
                  />
                )}
                {activePage === "transactions" && (
                  <Transactions state={state} onAddTransaction={addTransaction} />
                )}
                {activePage === "decisionlab" && (
                  <DecisionLab state={state} onConfirmPurchase={confirmPurchase} />
                )}
                {activePage === "savings" && (
                  <SavingsGoals
                    state={state}
                    metrics={metrics}
                    onUpdateGoal={updateGoal}
                    onAddSavings={addSavings}
                    onAddGoal={addGoal}
                  />
                )}
                {activePage === "commitments" && (
                  <Commitments
                    state={state}
                    onMarkPaid={markCommitmentPaid}
                    onCancel={cancelCommitment}
                    onAddCommitment={addCommitment}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        profile={profile}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        onResetProfile={handleResetProfile}
        onStartNewChallenge={handleStartNewChallenge}
        onLoadDemoData={handleLoadDemoData}
      />

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E8E5F0] rounded-2xl p-6 w-80 shadow-2xl"
            >
              <h3 className="text-base font-bold text-[#211F35] mb-2">Reset Demo Data?</h3>
              <p className="text-sm text-[#77748B] mb-5 leading-relaxed">
                This will erase all your changes and restore the original demo data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResetDemoData}
                  className="flex-1 bg-[#D65D69] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#c24b57] transition-colors shadow-xs"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 bg-[#F0EEFA] text-[#77748B] rounded-xl py-2.5 text-sm hover:text-[#211F35] transition-colors border border-[#E8E5F0]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
