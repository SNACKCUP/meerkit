"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import { AdminHeader } from "./AdminHeader";
import type { AdminLayoutProps } from "./types";

/** 탭형 레이아웃. 위쪽 줄 아래에 탭이 가로로 놓이고, 고른 섹션이 그 아래에 보인다. */
export function AdminTabsLayout({ items, serviceName = "Meerkit", backHref = "/", backLabel = "서비스로", className }: AdminLayoutProps) {
  const uid = useId();
  const [tab, setTab] = useState(items[0]?.id);
  // 섹션 목록이 바뀌어 고른 탭이 없어졌으면 첫 탭으로 돌아간다
  const current = items.find((t) => t.id === tab) ?? items[0];
  const Content = current?.Content;

  return (
    <div className={cn("overflow-hidden rounded-3xl border bg-surface shadow-soft", className)}>
      <AdminHeader serviceName={serviceName} backHref={backHref} backLabel={backLabel} />

      <nav aria-label="관리자 메뉴" className="border-y">
        <ul role="tablist" className="flex gap-1 overflow-x-auto px-3 sm:px-6">
          {items.map((t) => (
            <li key={t.id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`${uid}-tab-${t.id}`}
                aria-selected={t.id === current?.id}
                aria-controls={`${uid}-panel`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium outline-none transition-colors focus-visible:text-foreground",
                  t.id === current?.id ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section id={`${uid}-panel`} role="tabpanel" aria-labelledby={current ? `${uid}-tab-${current.id}` : undefined} className="grid gap-5 bg-background/60 p-5 sm:p-8">
        {Content ? <Content key={current.id} /> : null}
      </section>
    </div>
  );
}
