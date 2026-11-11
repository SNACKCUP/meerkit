"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** 관리자 킷 공통 조각. 표·카드·스위치·하위 탭의 모양을 한곳에서 맞춘다. */

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border bg-surface shadow-soft", className)} {...props} />;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** 밑줄형 하위 탭. items의 id마다 render가 본문을 그린다. */
export function SubTabs({ items, defaultId }: { items: { id: string; label: string; render: () => React.ReactNode }[]; defaultId?: string }) {
  return (
    <Tabs defaultValue={defaultId ?? items[0].id} className="grid gap-5">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
        {items.map((it) => (
          <TabsTrigger
            key={it.id}
            value={it.id}
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {it.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((it) => (
        <TabsContent key={it.id} value={it.id} className="grid gap-4">
          {it.render()}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// 색은 토큰(brand, destructive, muted)만 쓴다. 초록·노랑 같은 별도 색은 정의하지 않는다.
const TONES = { brand: "brand", red: "destructive", outline: "outline", gray: "secondary" } as const;

export function StatusBadge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <Badge variant={TONES[tone]}>{children}</Badge>;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function StatCard({ label, value, delta, tone }: { label: string; value: string; delta?: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border bg-surface px-4 py-3.5 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta && <p className={cn("mt-0.5 text-xs font-medium", tone === "down" ? "text-destructive" : "text-brand")}>{delta}</p>}
    </div>
  );
}

export const textareaClass =
  "min-h-28 w-full rounded-xl border bg-surface px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-brand/60 focus-visible:ring-[3px] focus-visible:ring-ring/15";
