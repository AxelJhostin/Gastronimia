import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function MetricCard({
  icon,
  label,
  tone = "neutral",
  value,
  trend,
}: {
  icon?: ReactNode;
  label: string;
  tone?: "neutral" | "warning" | "danger";
  value: string | number;
  trend?: ReactNode;
}) {
  const tones = {
    neutral: "border-gastro-outline-variant bg-white",
    warning: "border-orange-200 bg-orange-50",
    danger: "border-gastro-error-container bg-gastro-error-container",
  };

  return (
    <section className={cn("min-w-0 rounded-xl border p-5", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-gastro-muted">{label}</p>
        {icon ? <span aria-hidden="true" className="text-gastro-muted">{icon}</span> : null}
      </div>
      <p className="mt-7 text-4xl font-semibold tracking-tight text-gastro-primary">{value}</p>
      {trend ? <div className="mt-3">{trend}</div> : null}
    </section>
  );
}

export function Trend({
  direction,
  label,
}: {
  direction: "up" | "down" | "neutral";
  label: string;
}) {
  const symbols = { up: "↑", down: "↓", neutral: "→" };
  const colors = {
    up: "text-emerald-800",
    down: "text-gastro-error-strong",
    neutral: "text-gastro-muted",
  };

  return <p className={cn("text-sm font-medium", colors[direction])}><span aria-hidden="true">{symbols[direction]} </span>{label}</p>;
}

export type BarDatum = {
  label: string;
  value: number;
  detail?: string;
};

export function HorizontalBarChart({
  data,
  label,
  valueFormatter = (value) => String(value),
}: {
  data: BarDatum[];
  label: string;
  valueFormatter?: (value: number) => string;
}) {
  const maximum = Math.max(...data.map((item) => item.value), 1);

  return (
    <section aria-label={label}>
      <div className="space-y-4">
        {data.map((item) => {
          const percentage = Math.round((item.value / maximum) * 100);
          return (
            <div key={item.label}>
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-medium text-gastro-primary">{item.label}</span>
                <span className="font-mono text-gastro-muted">{item.detail ?? valueFormatter(item.value)}</span>
              </div>
              <div aria-label={`${item.label}: ${valueFormatter(item.value)}`} aria-valuemax={maximum} aria-valuemin={0} aria-valuenow={item.value} className="mt-2 h-2.5 overflow-hidden rounded-full bg-gastro-surface-high" role="progressbar">
                <div className="h-full rounded-full bg-gastro-action transition-[width]" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DonutChart({
  label,
  segments,
}: {
  label: string;
  segments: Array<{ color: string; label: string; value: number }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const stops = segments.map((segment, index) => {
    const previousTotal = segments
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.value, 0);
    const currentTotal = previousTotal + segment.value;
    const start = total ? (previousTotal / total) * 100 : 0;
    const end = total ? (currentTotal / total) * 100 : 0;
    return `${segment.color} ${start}% ${end}%`;
  });

  return (
    <section aria-label={label} className="flex flex-col items-center gap-5 sm:flex-row">
      <div aria-label={`${label}: ${total} en total`} className="grid size-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }}>
        <div className="grid size-24 place-items-center rounded-full bg-white text-center">
          <span className="text-2xl font-semibold text-gastro-primary">{total}</span>
          <span className="text-xs text-gastro-muted">total</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {segments.map((segment) => <li className="flex items-center justify-between gap-4 text-sm" key={segment.label}><span className="flex items-center gap-2 text-gastro-primary"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />{segment.label}</span><span className="font-mono text-gastro-muted">{segment.value}</span></li>)}
      </ul>
    </section>
  );
}

export type ActivityItem = {
  detail: string;
  title: string;
  tone?: "neutral" | "warning" | "danger";
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const dots = { neutral: "bg-gastro-primary", warning: "bg-gastro-action", danger: "bg-gastro-error" };
  return (
    <ol className="space-y-4">
      {items.map((item, index) => <li className="relative flex gap-3" key={`${item.title}-${index}`}><span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dots[item.tone ?? "neutral"])} /><div><p className="text-sm font-medium text-gastro-primary">{item.title}</p><p className="mt-0.5 text-sm text-gastro-muted">{item.detail}</p></div></li>)}
    </ol>
  );
}

export function AlertList({
  alerts,
}: {
  alerts: Array<{ action?: ReactNode; description: string; tone?: "warning" | "danger"; title: string }>;
}) {
  const tones = { warning: "border-orange-200 bg-orange-50", danger: "border-gastro-error-container bg-gastro-error-container" };
  return <ul className="space-y-3">{alerts.map((alert) => <li className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", tones[alert.tone ?? "warning"])} key={alert.title}><div><p className="font-semibold text-gastro-primary">{alert.title}</p><p className="mt-1 text-sm text-gastro-muted">{alert.description}</p></div>{alert.action ? <div className="shrink-0">{alert.action}</div> : null}</li>)}</ul>;
}
