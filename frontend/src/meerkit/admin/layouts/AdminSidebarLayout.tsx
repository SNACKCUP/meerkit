"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import { AdminHeader } from "./AdminHeader";
import type { AdminLayoutProps } from "./types";

/** 사이드바형 레이아웃. 메뉴가 왼쪽에 세로로 놓이고, 고른 섹션이 오른쪽에 보인다. 좁은 화면에서는 메뉴가 위쪽 가로 줄이 된다. */
export function AdminSidebarLayout({ items, serviceName = "Meerkit", backHref = "/", backLabel = "서비스로", className }: AdminLayoutProps) {
  const uid = useId();
  const [selected, setSelected] = useState(items[0]?.id);
  const current = items.find((t) => t.id === selected) ?? items[0];
  const Content = current?.Content;

  return (
    <div className={cn("overflow-hidden rounded-3xl border bg-surface shadow-soft", className)}>
      <AdminHeader serviceName={serviceName} backHref={backHref} backLabel={backLabel} />

      <div className="grid border-t md:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="관리자 메뉴" className="border-b md:border-b-0 md:border-r">
          <ul role="tablist" aria-orientation="vertical" className="flex gap-1 overflow-x-auto p-2 md:grid md:content-start md:gap-0.5 md:p-3">
            {items.map((t) => (
              <li key={t.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${t.id}`}
                  aria-selected={t.id === current?.id}
                  aria-controls={`${uid}-panel`}
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    "w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium outline-none transition-colors focus-visible:bg-accent",
                    t.id === current?.id ? "bg-brand/10 text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section id={`${uid}-panel`} role="tabpanel" aria-labelledby={current ? `${uid}-tab-${current.id}` : undefined} className="grid min-w-0 content-start gap-5 bg-background/60 p-5 sm:p-8">
          {Content ? <Content key={current.id} /> : null}
        </section>
      </div>
    </div>
  );
}
