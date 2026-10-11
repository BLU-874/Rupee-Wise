import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { FinancialState, FinancialMetrics } from "../types/finance";
import { getCategoryBreakdown, buildCashFlowProjection, formatINR } from "../utils/finance";

interface SpendingChartProps {
  state: FinancialState;
  metrics: FinancialMetrics;
}

const CustomTooltipDonut = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-xs shadow-md">
      <p className="capitalize text-[#77748B] mb-0.5">{payload[0].name}</p>
      <p className="text-[#211F35] font-bold tabular-nums">{formatINR(payload[0].value)}</p>
    </div>
  );
};

const CustomTooltipLine = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E5F0] rounded-xl px-3.5 py-2.5 text-xs shadow-md">
      <p className="text-[#77748B] mb-1 font-medium">Day {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#211F35] font-semibold tabular-nums">
          {p.name === "actual" ? "Actual" : "Projected"}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function SpendingChart({ state, metrics }: SpendingChartProps) {
  const breakdown = getCategoryBreakdown(state.transactions);
  const projection = buildCashFlowProjection(state, metrics);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Donut chart */}
      <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-[#211F35] mb-3.5">Spending by Category</h3>
        {breakdown.length === 0 ? (
          <div className="flex items-center justify-center h-36 text-[#77748B] text-sm">No expenses yet</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipDonut />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3 pt-2 border-t border-[#EDEAF4]">
              {breakdown.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="capitalize text-[#77748B]">{item.name}</span>
                  </div>
                  <span className="text-[#211F35] font-medium tabular-nums">{formatINR(item.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cash flow projection */}
      <div className="rounded-xl border border-[#E8E5F0] bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-[#211F35] mb-3.5">30-Day Cash Flow</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projection} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5138EC" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#5138EC" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7661F5" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#7661F5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAF4" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#9895A9", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#EDEAF4" }}
              interval={4}
              tickFormatter={(v) => `D${v}`}
            />
            <YAxis
              tick={{ fill: "#9895A9", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
              width={48}
            />
            <Tooltip content={<CustomTooltipLine />} />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#5138EC"
              strokeWidth={2}
              fill="url(#actualGrad)"
              name="actual"
              connectNulls={false}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#7661F5"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#projectedGrad)"
              name="projected"
              connectNulls
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 pt-2 border-t border-[#EDEAF4]">
          <div className="flex items-center gap-1.5 text-xs text-[#77748B]">
            <div className="w-3.5 h-1 bg-[#5138EC] rounded-full" />
            Actual
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#77748B]">
            <div className="w-3.5 h-0.5 border-t border-dashed border-[#7661F5]" />
            Projected
          </div>
        </div>
      </div>
    </div>
  );
}
