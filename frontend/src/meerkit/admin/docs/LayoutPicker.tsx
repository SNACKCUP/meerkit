"use client";

import { cn } from "@/lib/utils";

import type { AdminLayoutKind } from "../layouts/types";

const OPTIONS: { id: AdminLayoutKind; title: string; desc: string; fit: string }[] = [
  { id: "sidebar", title: "사이드바형", desc: "메뉴가 왼쪽에 세로로, 내용이 오른쪽에", fit: "섹션이 5개 이상이고 자주 오갈 때" },
  { id: "tabs", title: "탭형", desc: "메뉴가 위쪽에 가로 탭으로, 내용이 아래에", fit: "섹션이 3~5개인 작은 서비스" },
];

// 틀 모양을 보여 주는 작은 그림
function Thumb({ kind }: { kind: AdminLayoutKind }) {
  const bar = "rounded bg-muted-foreground/25";
  return (
    <div aria-hidden className="grid h-20 w-full overflow-hidden rounded-lg border bg-background">
      <div className="h-3 border-b bg-muted/60" />
      {kind === "sidebar" ? (
        <div className="grid grid-cols-[28%_1fr]">
          <div className="grid content-start gap-1 border-r p-1.5">
            <div className={cn(bar, "h-1.5 bg-brand/50")} />
            <div className={cn(bar, "h-1.5")} />
            <div className={cn(bar, "h-1.5")} />
          </div>
          <div className="grid content-start gap-1 p-1.5">
            <div className={cn(bar, "h-2 w-2/3")} />
            <div className={cn(bar, "h-5")} />
          </div>
        </div>
      ) : (
        <div className="grid content-start">
          <div className="flex gap-1.5 border-b px-1.5 py-1">
            <div className={cn(bar, "h-1.5 w-6 bg-brand/50")} />
            <div className={cn(bar, "h-1.5 w-6")} />
            <div className={cn(bar, "h-1.5 w-6")} />
          </div>
          <div className="grid content-start gap-1 p-1.5">
            <div className={cn(bar, "h-2 w-2/3")} />
            <div className={cn(bar, "h-3")} />
          </div>
        </div>
      )}
    </div>
  );
}

interface LayoutPickerProps {
  value: AdminLayoutKind;
  onChange: (next: AdminLayoutKind) => void;
}

/** 틀(레이아웃)을 고른다. 아래 미리보기가 바로 바뀐다. */
export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">레이아웃</legend>
      {OPTIONS.map((o) => (
        <label
          key={o.id}
          className={cn("grid cursor-pointer gap-3 rounded-2xl border bg-surface p-4 shadow-soft transition-colors", value === o.id && "border-brand/60 bg-brand/5")}
        >
          <input type="radio" name="admin-layout" className="peer sr-only" checked={value === o.id} onChange={() => onChange(o.id)} data-testid={`layout-${o.id}`} />
          <Thumb kind={o.id} />
          <span className="grid gap-0.5 peer-focus-visible:underline">
            <span className="text-[15px] font-semibold">{o.title}</span>
            <span className="text-[13px] text-muted-foreground">{o.desc}</span>
            <span className="text-xs text-muted-foreground">{o.fit}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
