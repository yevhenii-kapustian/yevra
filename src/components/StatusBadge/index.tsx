type StatusBadgeProps = {
  status: string;
};

// Matches the orders_fulfillment_status_check DB constraint: unfulfilled,
// fulfilling, shipped, delivered, cancelled. Sticks to the existing
// ink/accent/muted palette rather than inventing new semantic colors.
export default function StatusBadge({ status }: StatusBadgeProps) {
  const isDone = status === "delivered";
  const isCancelled = status === "cancelled";

  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize whitespace-nowrap"
      style={{
        background: isDone ? "var(--accent)" : isCancelled ? "transparent" : "var(--line)",
        color: isDone ? "white" : isCancelled ? "var(--muted)" : "var(--ink)",
        border: isCancelled ? "1.5px solid var(--line)" : "none",
      }}
    >
      {status}
    </span>
  );
}
