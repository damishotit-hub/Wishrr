import { naira } from "@/lib/format";

export function FundingBreakdown({ raised, goal }: { raised: number; goal: number }) {
  const remaining = Math.max(0, goal - raised);
  const rows = [
    { label: "Needed", value: goal },
    { label: "Contributed", value: raised },
    { label: "Remaining", value: remaining },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={[
            "card-flat px-3 py-3 text-center",
            i === 2 ? "bg-accent" : "",
          ].join(" ")}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-mute">
            {row.label}
          </dt>
          <dd className="mt-1 font-display text-base leading-tight">{naira(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
