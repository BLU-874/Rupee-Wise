import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowDown,
  Menu,
  X,
  Compass,
  Calendar as CalendarIcon,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import type { FinancialState, FinancialMetrics, UserProfile, Page } from "../types/finance";
import { formatINR } from "../utils/finance";
import { calculateChallengeProgress } from "../utils/dateUtils";

interface HeroSectionProps {
  state: FinancialState;
  metrics: FinancialMetrics;
  profile: UserProfile | null;
  onNavigate: (page: Page) => void;
  onScrollToWorkspace: () => void;
  onOpenOnboarding: () => void;
  onOpenProfile: () => void;
}

interface BackgroundMode {
  id: string;
  label: string;
  videoUrl: string;
  gradientClass: string;
  description: string;
}

const BG_MODES: BackgroundMode[] = [
  {
    id: "flow",
    label: "01 / FLOW",
    videoUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_030107_874273ea-684a-4e90-bb96-8fdfde48d53d.mp4",
    gradientClass:
      "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(81, 56, 236, 0.28), rgba(32, 30, 55, 0.95))",
    description: "Adaptive liquid momentum",
  },
  {
    id: "focus",
    label: "02 / FOCUS",
    videoUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4",
    gradientClass:
      "radial-gradient(ellipse 70% 50% at 65% 30%, rgba(118, 97, 245, 0.24), rgba(41, 38, 65, 0.95))",
    description: "Deep analytical calm",
  },
  {
    id: "clarity",
    label: "03 / CLARITY",
    videoUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260627_094019_4214ea73-b963-46a4-8327-61489192de99.mp4",
    gradientClass:
      "radial-gradient(ellipse 85% 65% at 35% 35%, rgba(182, 168, 255, 0.22), rgba(32, 30, 55, 0.95))",
    description: "Crystal decision horizon",
  },
];

function getDynamicGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function HeroSection({
  state,
  metrics,
  profile,
  onNavigate,
  onScrollToWorkspace,
  onOpenOnboarding,
  onOpenProfile,
}: HeroSectionProps) {
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState<Record<string, boolean>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentMode = BG_MODES[activeModeIndex];

  // Subscribe to reduced motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Derive dynamic 30-day challenge progress
  const challenge = calculateChallengeProgress(state.periodStart, state.totalDays);

  // Calculate budget statistics
  const spentPercent = Math.min(
    100,
    (metrics.totalSpent / state.startingBudget) * 100
  );
  const isSpendingControlled = spentPercent <= challenge.timeProgressPercent + 5;

  const firstName = profile?.fullName
    ? profile.fullName.trim().split(" ")[0].toUpperCase()
    : "SAVER";

  const greeting = `${getDynamicGreeting()}, ${firstName}`;

  const initials = profile?.fullName
    ? profile.fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "RW";

  function handleNavClick(page: Page) {
    onNavigate(page);
    setMobileMenuOpen(false);
    onScrollToWorkspace();
  }

  function handleDecisionLabExplore() {
    onNavigate("decisionlab");
    onScrollToWorkspace();
  }

  return (
    <section
      aria-label="Introduction to RupeeWise 30-Day Budget Challenge"
      className="relative min-h-[100svh] w-full flex flex-col justify-between overflow-hidden bg-[#201E37] text-white selection:bg-[#5138EC] selection:text-white"
    >
      {/* ── Background Media Layer ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Dynamic Fallback CSS Gradients */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            background: `${currentMode.gradientClass}, #201E37`,
          }}
        />

        {/* Ambient Video Player */}
        {!prefersReducedMotion && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMode.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {!videoFailed[currentMode.id] && (
                <video
                  ref={videoRef}
                  src={currentMode.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onError={() => {
                    setVideoFailed((prev) => ({ ...prev, [currentMode.id]: true }));
                  }}
                  className="w-full h-full object-cover opacity-90"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Subtle, Balanced Overlays: light 22% indigo tint + top/bottom edge vignette + localized text backdrop */}
        <div className="absolute inset-0 bg-[#201E37]/22" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#201E37]/60 via-transparent to-[#201E37]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_20%_45%,rgba(32,30,55,0.45),transparent_70%)]" />
      </div>

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="relative z-20 w-full border-b border-[#3A3656]/60 backdrop-blur-md bg-[#201E37]/60">
        <div className="max-w-[1340px] mx-auto px-6 lg:px-10 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={onScrollToWorkspace}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7661F5] to-[#5138EC] flex items-center justify-center shadow-md shadow-[#5138EC]/20 group-hover:scale-105 transition-transform duration-200">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-lg tracking-tight">Rupee</span>
              <span className="font-bold text-[#B6A8FF] text-lg tracking-tight">Wise</span>
              <span className="block text-[10px] text-[#C4C0DB] tracking-wider uppercase">Simulator</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#C4C0DB]">
            <button
              onClick={() => handleNavClick("overview")}
              className="hover:text-white transition-colors relative py-1 group"
            >
              Overview
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B6A8FF] group-hover:w-full transition-all duration-200" />
            </button>
            <button
              onClick={() => handleNavClick("calendar")}
              className="hover:text-white transition-colors relative py-1 group flex items-center gap-1.5"
            >
              <CalendarIcon size={14} className="text-[#B6A8FF]" />
              <span>Calendar</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B6A8FF] group-hover:w-full transition-all duration-200" />
            </button>
            <button
              onClick={() => handleNavClick("decisionlab")}
              className="hover:text-white transition-colors relative py-1 group"
            >
              Decision Lab
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B6A8FF] group-hover:w-full transition-all duration-200" />
            </button>
            <button
              onClick={() => handleNavClick("savings")}
              className="hover:text-white transition-colors relative py-1 group"
            >
              Savings Goals
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B6A8FF] group-hover:w-full transition-all duration-200" />
            </button>
          </nav>

          {/* Right Action & Profile / Challenge Pill */}
          <div className="hidden sm:flex items-center gap-3">
            {/* 30-Day Challenge Status Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#292641] border border-[#3A3656] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#319A77] animate-pulse" />
              <span className="text-[#C4C0DB] font-medium">Day {challenge.currentDay} of {challenge.totalDays}</span>
              <span className="text-[#B6A8FF] font-semibold tabular-nums">({challenge.daysRemaining}d left)</span>
            </div>

            {/* Returning Profile Avatar vs First-time Get Started */}
            {profile ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#292641] border border-[#3A3656] hover:border-[#B6A8FF]/40 text-xs text-white transition-all group"
                title="Manage user profile & challenge"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: profile.avatarColor || "#5138EC" }}
                >
                  {initials}
                </div>
                <span className="font-semibold text-xs text-[#C4C0DB] group-hover:text-white">
                  {profile.fullName.split(" ")[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenOnboarding}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Sparkles size={13} />
                <span>Get started</span>
              </button>
            )}

            {/* Open Workspace Action */}
            <button
              onClick={onScrollToWorkspace}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/40 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>Workspace</span>
              <ArrowDown size={13} className="text-[#B6A8FF]" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#292641] border border-[#3A3656] text-[#C4C0DB] hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[#3A3656] bg-[#292641] px-6 py-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#3A3656]/50 text-xs text-[#C4C0DB]">
                <span>30-Day Challenge</span>
                <span className="text-[#B6A8FF] font-semibold">
                  Day {challenge.currentDay} of {challenge.totalDays}
                </span>
              </div>

              {profile ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2.5 py-2 text-sm text-white font-medium border-b border-[#3A3656]/40 pb-2.5"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: profile.avatarColor || "#5138EC" }}
                  >
                    {initials}
                  </div>
                  <span>{profile.fullName} (Edit Profile)</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOnboarding();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Get Started (New Profile)</span>
                </button>
              )}

              <button
                onClick={() => handleNavClick("overview")}
                className="w-full text-left py-2 text-sm text-white font-medium"
              >
                Overview Dashboard
              </button>
              <button
                onClick={() => handleNavClick("calendar")}
                className="w-full text-left py-2 text-sm text-white font-medium flex items-center gap-2"
              >
                <CalendarIcon size={14} className="text-[#B6A8FF]" />
                <span>Financial Calendar</span>
              </button>
              <button
                onClick={() => handleNavClick("decisionlab")}
                className="w-full text-left py-2 text-sm text-white font-medium"
              >
                Decision Lab Simulator
              </button>
              <button
                onClick={() => handleNavClick("savings")}
                className="w-full text-left py-2 text-sm text-white font-medium"
              >
                Savings Goals
              </button>
              <button
                onClick={onScrollToWorkspace}
                className="w-full mt-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Enter Workspace</span>
                <ArrowDown size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Hero Editorial Content ─────────────────────────────────── */}
      <div className="relative z-10 max-w-[1340px] mx-auto px-6 lg:px-10 py-10 lg:py-16 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Headlines & Actions */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Dynamic Greeting Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#292641]/90 border border-[#3A3656] text-[#B6A8FF] text-xs font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5138EC]" />
              <span>{greeting}</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
              Make every <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-[#B6A8FF] to-[#7661F5] bg-clip-text text-transparent">
                rupee count.
              </span>
            </h1>

            {/* Concise Description */}
            <p className="text-base sm:text-lg text-[#C4C0DB] max-w-xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              Your ₹10,000. Your next 30 days. A smarter way to simulate and test financial decisions before committing real money.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onScrollToWorkspace}
                className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white font-semibold text-sm shadow-lg shadow-[#5138EC]/35 transition-all duration-200 flex items-center gap-2.5 active:scale-[0.98]"
              >
                <span>Enter my workspace</span>
                <ArrowDown
                  size={16}
                  className="group-hover:translate-y-0.5 transition-transform duration-200 text-white"
                />
              </button>

              <button
                onClick={handleDecisionLabExplore}
                className="px-5 py-3.5 rounded-2xl bg-[#292641]/80 hover:bg-[#292641] text-[#C4C0DB] hover:text-white font-medium text-sm border border-[#3A3656] hover:border-[#7661F5]/40 transition-all duration-200 flex items-center gap-2"
              >
                <Compass size={16} className="text-[#B6A8FF]" />
                <span>Explore Decision Lab</span>
              </button>
            </div>
          </motion.div>

          {/* Right Column: 30-Day Budget Challenge Panel */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="rounded-3xl border border-[#3A3656] bg-[#201E37]/90 backdrop-blur-xl p-6 sm:p-7 shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#3A3656]/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#292641] border border-[#3A3656] flex items-center justify-center">
                    <CalendarIcon size={15} className="text-[#B6A8FF]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#C4C0DB]">
                      30-Day Simulation
                    </h2>
                    <p className="text-sm font-bold text-white">Challenge Status</p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isSpendingControlled
                      ? "bg-[#319A77]/15 border-[#319A77]/30 text-[#319A77]"
                      : "bg-[#C98B27]/15 border-[#C98B27]/30 text-[#C98B27]"
                  }`}
                >
                  {isSpendingControlled ? "Pace: On Track" : "Pace: Over Average"}
                </div>
              </div>

              {/* Budget & Spend Grid */}
              <div className="grid grid-cols-2 gap-3 py-5">
                <div className="p-3.5 rounded-2xl bg-[#292641]/80 border border-[#3A3656]">
                  <p className="text-xs text-[#C4C0DB]">Starting Budget</p>
                  <p className="text-lg sm:text-xl font-bold text-white mt-1 tabular-nums flex items-center gap-0.5">
                    <IndianRupee size={15} className="text-[#B6A8FF]" />
                    {state.startingBudget.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-[#9895A9] mt-0.5">30-day fixed pool</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#292641]/80 border border-[#3A3656]">
                  <p className="text-xs text-[#C4C0DB]">Spent So Far</p>
                  <p className="text-lg sm:text-xl font-bold text-[#D65D69] mt-1 tabular-nums flex items-center gap-0.5">
                    <IndianRupee size={15} className="text-[#D65D69]" />
                    {metrics.totalSpent.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-[#9895A9] mt-0.5">{spentPercent.toFixed(0)}% of budget</p>
                </div>
              </div>

              {/* Comparative Progress Bars */}
              <div className="space-y-4 pt-1">
                {/* Spending Progress */}
                <div>
                  <div className="flex justify-between text-xs text-[#C4C0DB] mb-1.5">
                    <span>Spending Progress</span>
                    <span className="font-semibold text-white tabular-nums">{spentPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#292641] border border-[#3A3656] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${spentPercent}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#7661F5] to-[#D65D69]"
                    />
                  </div>
                </div>

                {/* Challenge Days Elapsed */}
                <div>
                  <div className="flex justify-between text-xs text-[#C4C0DB] mb-1.5">
                    <span>Challenge Timeline</span>
                    <span className="font-semibold text-white tabular-nums">
                      Day {challenge.currentDay} of {challenge.totalDays} ({challenge.timeProgressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#292641] border border-[#3A3656] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${challenge.timeProgressPercent}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#5138EC] to-[#319A77]"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Context */}
              <div className="mt-5 pt-4 border-t border-[#3A3656]/60 flex items-center justify-between text-xs text-[#C4C0DB]">
                <span>Safe Daily Allowance</span>
                <span className="font-bold text-[#319A77] tabular-nums text-sm">
                  {formatINR(metrics.safeDailyAllowance)}/day
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom Ambient Switcher & Scroll Guide ─────────────────────────── */}
      <footer className="relative z-20 w-full border-t border-[#3A3656]/50 bg-[#201E37]/80 backdrop-blur-md">
        <div className="max-w-[1340px] mx-auto px-6 lg:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ambient Visual Mode Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#9895A9] uppercase tracking-wider text-[11px] mr-1 hidden sm:inline">
              Atmosphere:
            </span>
            {BG_MODES.map((mode, index) => {
              const active = index === activeModeIndex;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveModeIndex(index)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-[#5138EC] text-white shadow-xs font-semibold"
                      : "text-[#C4C0DB] hover:text-white hover:bg-[#292641]"
                  }`}
                  aria-pressed={active}
                  title={mode.description}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Smooth Scroll Guide */}
          <button
            onClick={onScrollToWorkspace}
            className="flex items-center gap-2 text-xs text-[#C4C0DB] hover:text-white group transition-colors"
          >
            <span className="tracking-wide">Scroll to financial dashboard</span>
            <div className="w-5 h-5 rounded-full bg-[#292641] border border-[#3A3656] flex items-center justify-center group-hover:border-[#B6A8FF] transition-colors">
              <ArrowDown size={11} className="text-[#B6A8FF] group-hover:translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </footer>
    </section>
  );
}
