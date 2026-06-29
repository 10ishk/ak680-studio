import type { ReactNode } from "react";

interface InfoGridProps {
  items: Array<{ label: string; value: ReactNode }>;
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-line bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-moss">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-ink">{item.value ?? "Not present"}</dd>
        </div>
      ))}
    </dl>
  );
}

