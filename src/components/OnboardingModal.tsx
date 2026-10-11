import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, User, Mail, Palette, X } from "lucide-react";
import type { UserProfile } from "../types/finance";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile) => void;
}

const AVATAR_COLORS = [
  { hex: "#5138EC", label: "Violet" },
  { hex: "#7661F5", label: "Lavender" },
  { hex: "#319A77", label: "Emerald" },
  { hex: "#201E37", label: "Indigo" },
  { hex: "#C98B27", label: "Amber" },
];

export default function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].hex);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  if (!isOpen) return null;

  function validate(): boolean {
    const newErrors: { fullName?: string; email?: string } = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const profile: UserProfile = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      avatarColor,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onComplete(profile);
  }

  const initials = fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "RW";

  return (
    <AnimatePresence>
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
            aria-label="Close onboarding modal"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#EEEAFE] flex items-center justify-center text-[#5138EC]">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7661F5]">
                Welcome to RupeeWise
              </span>
              <h2 className="text-xl font-bold text-[#211F35] tracking-tight">
                Start Your 30-Day Journey
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#77748B] mb-6 leading-relaxed">
            Create your local personal profile to begin your ₹10,000 monthly budget simulation. No password required.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#211F35] mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-[#77748B]" />
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Aditi Rao"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#211F35] placeholder-[#9895A9] focus:outline-none transition-all ${
                  errors.fullName
                    ? "border-[#D65D69] focus:ring-2 focus:ring-[#D65D69]/20"
                    : "border-[#E8E5F0] focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15"
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-[#D65D69] mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#211F35] mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-[#77748B]" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="aditi@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#211F35] placeholder-[#9895A9] focus:outline-none transition-all ${
                  errors.email
                    ? "border-[#D65D69] focus:ring-2 focus:ring-[#D65D69]/20"
                    : "border-[#E8E5F0] focus:border-[#5138EC] focus:ring-2 focus:ring-[#5138EC]/15"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-[#D65D69] mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Avatar Color Picker & Live Preview */}
            <div>
              <label className="block text-xs font-semibold text-[#211F35] mb-2 flex items-center gap-1.5">
                <Palette size={13} className="text-[#77748B]" />
                Avatar Theme & Preview
              </label>
              <div className="flex items-center gap-4">
                {/* Live Avatar Preview */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm border border-white/20 transition-colors"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>

                {/* Color Swatches */}
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
                      aria-label={`Select ${c.label} avatar color`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7661F5] to-[#5138EC] hover:from-[#8875FF] hover:to-[#5E47F3] text-white font-semibold text-sm shadow-md shadow-[#5138EC]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Enter RupeeWise</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
