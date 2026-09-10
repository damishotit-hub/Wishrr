import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-card/60 p-8 text-center">
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm text-mute">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-card/60 p-8 text-center">
      <h3 className="font-display text-lg">Something didn't load</h3>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm text-mute">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
