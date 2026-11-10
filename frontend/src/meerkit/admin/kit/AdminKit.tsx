"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { AuditTab, CodesTab, EmailTab, MembersTab } from "./sections-a";
import { BoardsTab, PermissionsTab, ProfanityTab } from "./sections-b";
import { StatsTab, SystemTab, TermsTab } from "./sections-c";

const TABS = [
  { id: "members", label: "회원", Content: MembersTab },
  { id: "audit", label: "감사 로그", Content: AuditTab },
  { id: "codes", label: "공통 코드", Content: CodesTab },
  { id: "email", label: "이메일", Content: EmailTab },
  { id: "profanity", label: "비속어", Content: ProfanityTab },
  { id: "boards", label: "게시판", Content: BoardsTab },
  { id: "permissions", label: "권한", Content: PermissionsTab },
  { id: "terms", label: "약관", Content: TermsTab },
  { id: "system", label: "시스템", Content: SystemTab },
  { id: "stats", label: "접속 통계", Content: StatsTab },
] as const;

interface AdminKitProps {
  /** 서비스 이름. 헤더 왼쪽에 보인다 */
  serviceName?: string;
  /** "서비스로" 링크가 가는 주소 */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * 관리자 화면 템플릿. 회원·감사 로그·공통 코드 등 10개 탭을 한 틀에 담았다.
 * 프론트 UI만 제공하며 데이터는 목(mock)이다. 서버와 연결하려면 각 탭의 목 데이터를 API 결과로 바꾼다.
 */
export function AdminKit({ serviceName = "Meerkit", backHref = "/", backLabel = "서비스로", className }: AdminKitProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("members");
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  const Content = current.Content;

  return (
    <div className={cn("overflow-hidden rounded-3xl border bg-surface shadow-soft", className)}>
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-tight">{serviceName}</span>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> {backLabel}
          </Link>
          <span aria-hidden className="grid size-9 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">MK</span>
        </div>
      </header>

      <nav aria-label="관리자 메뉴" className="border-y">
        <ul role="tablist" className="flex gap-1 overflow-x-auto px-3 sm:px-6">
          {TABS.map((t) => (
            <li key={t.id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`admin-kit-tab-${t.id}`}
                aria-selected={t.id === tab}
                aria-controls="admin-kit-panel"
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium outline-none transition-colors focus-visible:text-foreground",
                  t.id === tab ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section id="admin-kit-panel" role="tabpanel" aria-labelledby={`admin-kit-tab-${current.id}`} className="grid gap-5 bg-background/60 p-5 sm:p-8">
        <Content key={current.id} />
      </section>
    </div>
  );
}
