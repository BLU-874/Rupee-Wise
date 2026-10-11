import { useState, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RotateCcw, Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import HeroSection from "./components/HeroSection";
import WorkspaceSkeleton from "./components/WorkspaceSkeleton";
import OnboardingModal from "./components/OnboardingModal";
import ProfileModal from "./components/ProfileModal";
import { useFinancialState, useUserProfile } from "./hooks";
import { createNewUserFinancialState } from "./utils/storage";
import type { Page, UserProfile } from "./types/finance";

// Lazy-loaded workspace pages for optimal initial bundle loading
const Overview = lazy(() => import("./pages/Overview"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Transactions = lazy(() => import("./pages/Transactions"));
const DecisionLab = lazy(() => import("./pages/DecisionLab"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Commitments = lazy(() => import("./pages/Commitments"));

const PAGE_TITLES: Record<Page, string> = {
  overview: "Overview",
  calendar: "Financial Calendar",
  transactions: "Transactions",
  decisionlab: "Decision Lab",
  savings: "Savings Goals",
  commitments: "Commitments",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const {
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
    setFinancialState,
  } = useFinancialState();

  const {
    profile,
    userDisplayName,
    userInitials,
    handleSaveProfile,
    handleResetProfile,
    handleCompleteOnboarding,
  } = useUserProfile();

  const [activePage, setActivePage] = useState<Page>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const scrollToWorkspace = useCallback(() => {
    const el = document.getElementById("workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleOnboardingComplete = useCallback(
    (newProfile: UserProfile) => {
      handleCompleteOnboarding(newProfile);
      const freshState = createNewUserFinancialState();
      setFinancialState(freshState);
      setShowOnboarding(false);
      scrollToWorkspace();
    },
    [handleCompleteOnboarding, setFinancialState, scrollToWorkspace]
  );

  const onResetProfile = useCallback(() => {
    handleResetProfile();
    const freshState = createNewUserFinancialState();
    setFinancialState(freshState);
  }, [handleResetProfile, setFinancialState]);

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
    setMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F6FC] text-[#211F35] flex flex-col font-sans">
      {/* ── 1. Full-Screen Cinematic Hero ── */}
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
      <div id="workspace" className="flex flex-1 min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar / Header */}
          <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E8E5F0] flex items-center justify-between px-5 lg:px-7 sticky top-0 z-20">
            <div>
              <p className="text-xs text-[#77748B] font-medium">
                {getGreeting()}, <span className="font-semibold text-[#211F35]">{userDisplayName}</span>
              </p>
              <h1 className="text-lg font-bold text-[#211F35] tracking-tight leading-tight">
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
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7F6FC] hover:bg-[#F0EEFA] border border-[#E8E5F0] text-xs font-medium text-[#211F35] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5138EC]"
                  title="Profile & Challenge Settings"
                  aria-label="Manage profile and challenge settings"
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
                  className="px-3 py-1 rounded-full bg-[#EEEAFE] hover:bg-[#E3DCFE] text-[#5138EC] text-xs font-semibold border border-[#5138EC]/20 flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5138EC]"
                >
                  <Sparkles size={13} />
                  <span>Onboard</span>
                </button>
              )}

              {/* Notification button */}
              <button
                className="w-8 h-8 rounded-lg bg-[#F7F6FC] border border-[#E8E5F0] flex items-center justify-center text-[#77748B] hover:text-[#5138EC] hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5138EC]"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell size={15} />
              </button>

              {/* Reset Demo Data */}
              <button
                onClick={() => setShowReset(true)}
                className="w-8 h-8 rounded-lg bg-[#F7F6FC] border border-[#E8E5F0] flex items-center justify-center text-[#77748B] hover:text-[#D65D69] hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D65D69]"
                title="Reset simulation data"
                aria-label="Reset simulation data to demo baseline"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </header>

          {/* Main Content with Suspense and Zero-Layout-Shift Skeleton */}
          <main className="flex-1 p-5 lg:p-7 max-w-[1400px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<WorkspaceSkeleton />}>
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
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── 3. Modals ── */}

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
        onResetProfile={onResetProfile}
        onStartNewChallenge={startNewChallenge}
        onLoadDemoData={loadDemoData}
      />

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E8E5F0] rounded-2xl p-6 w-80 shadow-2xl"
            >
              <h3 id="reset-dialog-title" className="text-base font-bold text-[#211F35] mb-2">Reset Demo Data?</h3>
              <p className="text-sm text-[#77748B] mb-5 leading-relaxed">
                This will erase all your changes and restore the original demo data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetDemoData();
                    setShowReset(false);
                  }}
                  className="flex-1 bg-[#D65D69] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#c24b57] transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D65D69]"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 bg-[#F0EEFA] text-[#77748B] rounded-xl py-2.5 text-sm hover:text-[#211F35] transition-colors border border-[#E8E5F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5138EC]"
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
