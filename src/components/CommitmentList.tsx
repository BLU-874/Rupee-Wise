import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, AlertCircle, Star } from "lucide-react";
import type { Commitment } from "../types/finance";
import { formatINR } from "../utils/finance";

interface CommitmentListProps {
  commitments: Commitment[];
  onMarkPaid?: (id: string) => void;
  onCancel?: (id: string) => void;
  compact?: boolean;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function CommitmentList({
  commitments,
  onMarkPaid,
  onCancel,
  compact = false,
}: CommitmentListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"pay" | "cancel" | null>(null);

  const sorted = [...commitments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  function handleTriggerAction(id: string, type: "pay" | "cancel") {
    setConfirmingId(id);
    setActionType(type);
  }

  function handleConfirmAction(id: string) {
    if (actionType === "pay" && onMarkPaid) {
      onMarkPaid(id);
    } else if (actionType === "cancel" && onCancel) {
      onCancel(id);
    }
    setConfirmingId(null);
    setActionType(null);
  }

  return (
    <div className="space-y-2">
      {sorted.map((c, i) => {
        const due = daysUntil(c.dueDate);
        const isOverdue = due < 0 && c.status === "unpaid";
        const isDueSoon = due >= 0 && due <= 5 && c.status === "unpaid";
        const isPrompting = confirmingId === c.id;

        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
              c.status === "paid"
                ? "bg-[#E7F6EF] border-[#319A77]/30"
                : c.status === "cancelled"
                ? "bg-[#F0EEFA] border-[#E8E5F0] opacity-60"
                : isOverdue
                ? "bg-[#FCEAEC] border-[#D65D69]/30"
                : isDueSoon
                ? "bg-[#FFF4DE] border-[#C98B27]/30"
                : "bg-white border-[#E8E5F0] hover:border-[#B6A8FF]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Status icon */}
              {c.status === "paid" ? (
                <CheckCircle2 size={16} className="text-[#319A77] flex-shrink-0" />
              ) : c.status === "cancelled" ? (
                <XCircle size={16} className="text-[#77748B] flex-shrink-0" />
              ) : isOverdue ? (
                <AlertCircle size={16} className="text-[#D65D69] flex-shrink-0" />
              ) : isDueSoon ? (
                <AlertCircle size={16} className="text-[#C98B27] flex-shrink-0" />
              ) : (
                <Clock size={16} className="text-[#9895A9] flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-sm font-medium truncate ${
                      c.status === "cancelled" ? "line-through text-[#77748B]" : "text-[#211F35]"
                    }`}
                  >
                    {c.description}
                  </p>
                  {c.type === "essential" && (
                    <Star size={11} className="text-[#C98B27] flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-[#77748B] mt-0.5">
                    {c.status === "paid"
                      ? "Paid & recorded in budget"
                      : c.status === "cancelled"
                      ? "Cancelled"
                      : isOverdue
                      ? `Overdue by ${Math.abs(due)} day${Math.abs(due) !== 1 ? "s" : ""}`
                      : due === 0
                      ? "Due today"
                      : `Due in ${due} day${due !== 1 ? "s" : ""}`}
                    {" · "}
                    {new Date(c.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
              {/* Amount */}
              <p
                className={`text-sm font-bold tabular-nums ${
                  c.status === "paid"
                    ? "text-[#77748B] line-through"
                    : c.status === "cancelled"
                    ? "text-[#77748B]"
                    : "text-[#211F35]"
                }`}
              >
                {formatINR(c.amount)}
              </p>

              {/* Actions & Confirmations */}
              {!compact && c.status === "unpaid" && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPrompting ? (
                    <div className="flex items-center gap-1.5 bg-white border border-[#E8E5F0] rounded-lg p-1 shadow-xs">
                      <span className="text-[11px] font-semibold text-[#211F35] px-1">
                        {actionType === "pay" ? "Deduct ₹" + c.amount + "?" : "Cancel bill?"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(c.id)}
                        className={`text-[11px] px-2 py-0.5 rounded font-bold text-white transition-all ${
                          actionType === "pay" ? "bg-[#319A77] hover:bg-[#287b5f]" : "bg-[#D65D69] hover:bg-[#b84b56]"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingId(null);
                          setActionType(null);
                        }}
                        className="text-[11px] px-1.5 py-0.5 rounded text-[#77748B] hover:text-[#211F35]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      {onMarkPaid && (
                        <button
                          type="button"
                          onClick={() => handleTriggerAction(c.id, "pay")}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#E7F6EF] text-[#319A77] font-semibold hover:bg-[#d5f0e3] transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {onCancel && (
                        <button
                          type="button"
                          onClick={() => handleTriggerAction(c.id, "cancel")}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#F0EEFA] text-[#77748B] hover:bg-[#FCEAEC] hover:text-[#D65D69] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
