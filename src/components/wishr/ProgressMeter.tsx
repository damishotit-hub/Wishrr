import { naira, progressPercent } from "@/lib/format";

export function ProgressMeter({
  raised,
  goal,
  animate = true,
}: {
  raised: number;
  goal: number;
  animate?: boolean;
}) {
  const percent = progressPercent(raised, goal);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">
          {naira(raised)} <span className="font-normal text-mute">raised</span>
        </span>
        <span className="text-mute">of {naira(goal)}</span>
      </div>
      <div
        className="mt-2 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-warm"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Amount raised"
      >
        <div
          className={
            animate
              ? "fillbar h-full bg-primary"
              : "h-full bg-primary transition-[width] duration-500"
          }
          style={{ width: `${percent}%` }}
        />
      </div>

    </div>
  );
}
