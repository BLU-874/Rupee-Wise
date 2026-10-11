import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Palette, X, Check, Sparkles } from "lucide-react";
import type { UserProfile } from "../types/finance";

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onResetProfile: () => void;
  onStartNewChallenge: () => void;
  onLoadDemoData: () => void;
}

const AVATAR_COLORS = [
  { hex: "#5138EC", label: "Violet" },
  { hex: "#7661F5", label: "Lavender" },
  { hex: "#319A77", label: "Emerald" },
  { hex: "#201E37", label: "Indigo" },
  { hex: "#C98B27", label: "Amber" },
];

function ProfileModalContent({
  profile,
  onClose,
  onSave,
  onResetProfile,
  onStartNewChallenge,
  onLoadDemoData,
}: Omit<ProfileModalProps, "isOpen"> & { profile: UserProfile }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor || AVATAR_COLORS[0].hex);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmNewChallenge, setConfirmNewChallenge] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...profile,
      fullName: fullName.trim() || profile.fullName,
      email: email.trim() || profile.email,
      avatarColor,
    });
    onClose();
  }

  const initials = (fullName || profile.fullName || "RW")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-white rounded-3xl border border-[#E8E5F0] shadow-2xl p-6 sm:p-8 text-[#211F35]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#77748B] hover:text-[#211F35] hover:bg-[#F0EEFA] transition-colors"
          aria-label="Close profile modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm border border-white/20"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#211F35] tracking-tight">Your Profile</h2>
            <p className="text-xs text-[#77748B]">Personalize your simulation identity</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#211F35] mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-[#77748B]" />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#211F35] mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-[#77748B]" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F0] text-sm text-[#211F35] focus:outline-none focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15 transition-all"
            />
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block text-xs font-semibold text-[#211F35] mb-2 flex items-center gap-1.5">
              <Palette size={13} className="text-[#77748B]" />
              Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAvatarColor(c.hex)}
                  className={`w-7 h-7 rounded-xl transition-transform ${
                    avatarColor === c.hex
                      ? "ring-2 ring-offset-2 ring-[#5138EC] scale-110"
                      : "hover:scale-105 opacity-85 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Select ${c.label} color`}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white font-semibold text-xs shadow-md shadow-[#5138EC]/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>

        {/* Additional Actions Divider */}
        <div className="mt-6 pt-5 border-t border-[#E8E5F0] space-y-3">
          {/* Start New 30-Day Challenge */}
          {!confirmNewChallenge ? (
            <button
              type="button"
              onClick={() => setConfirmNewChallenge(true)}
              className="w-full py-2 px-3 rounded-xl border border-[#E8E5F0] bg-[#F7F6FC] hover:bg-[#EEEAFE] hover:border-[#5138EC]/30 text-xs font-medium text-[#5138EC] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={13} />
              <span>Start a New 30-Day Challenge</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#FFF4DE] border border-[#C98B27]/40 space-y-2">
              <p className="text-xs text-[#211F35] font-semibold">
                Start fresh 30-day challenge beginning today?
              </p>
              <p className="text-[11px] text-[#77748B]">
                Resets start date to today and initializes a clean ₹10,000 personal budget.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onStartNewChallenge();
                    setConfirmNewChallenge(false);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#C98B27] text-white text-xs font-semibold hover:bg-[#b07820]"
                >
                  Confirm Start
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmNewChallenge(false)}
                  className="flex-1 py-1.5 rounded-lg bg-white border border-[#E8E5F0] text-xs text-[#77748B]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Load Sample Demo Data (Hackathon Presentation) */}
          <button
            type="button"
            onClick={() => {
              onLoadDemoData();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl border border-[#E8E5F0] bg-[#F7F6FC] hover:bg-white text-xs font-medium text-[#77748B] hover:text-[#211F35] transition-all flex items-center justify-center gap-2"
          >
            <span>Load Populated Demo State (Arjun Sharma, ₹7,162)</span>
          </button>

          {/* Reset Profile */}
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full text-center py-1 text-[11px] text-[#D65D69] hover:underline transition-all"
            >
              Reset profile & onboarding state
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#FCEAEC] border border-[#D65D69]/40 space-y-2">
              <p className="text-xs text-[#211F35] font-semibold">
                Reset your profile?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetProfile();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#D65D69] text-white text-xs font-semibold hover:bg-[#c24b57]"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1.5 rounded-lg bg-white border border-[#E8E5F0] text-xs text-[#77748B]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfileModal(props: ProfileModalProps) {
  if (!props.isOpen || !props.profile) return null;
  return (
    <AnimatePresence>
      <ProfileModalContent {...props} profile={props.profile} />
    </AnimatePresence>
  );
}
