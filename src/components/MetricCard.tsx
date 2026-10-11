import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  Icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  accent?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  Icon,
  iconColor = "#5138EC",
  accent,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl border border-[#E8E5F0] bg-white p-4 shadow-xs hover:border-[#B6A8FF]/60 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[#77748B] text-xs font-medium">{title}</p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EEEAFE]"
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold tracking-tight leading-tight mb-1 tabular-nums"
        style={{ color: accent || "#211F35" }}
      >
        {value}
      </p>
      <p className="text-[#77748B] text-xs leading-relaxed line-clamp-2">{subtitle}</p>
    </motion.div>
  );
}
