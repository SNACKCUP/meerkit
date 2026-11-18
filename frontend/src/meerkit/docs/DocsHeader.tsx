"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { LogoMark } from "../brand/LogoMark";
import { meerkitConfig } from "../config";
import { ThemeToggle } from "../theme/ThemeToggle";

// 검색은 /docs/search?q=... 페이지에서 한다. 헤더 입력창은 그 주소로 이동시킨다.
function HeaderSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  return (
    <form
      role="search"
      className="hidden items-center gap-2 rounded-xl border bg-surface px-3 py-1.5 text-[13px] text-muted-foreground sm:flex"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/docs/search?q=${encodeURIComponent(q)}` : "/docs/search");
      }}
    >
      <Search className="size-3.5" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search documentation…"
        className="w-44 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

export type DocsSection = "docs" | "components" | "api" | "admin";

interface DocsHeaderProps {
  /** 지금 보고 있는 구역. 상단 메뉴(GNB)에서 진하게 표시한다 */
  active: DocsSection;
  query?: string;
  /** 있으면 좁은 화면에서 메뉴 버튼을 보여 준다 (사이드바가 있는 화면용) */
  onOpenMenu?: () => void;
}

// 문서 화면 위쪽 줄. 일반 문서(/docs)와 관리자 문서(/admin-docs)가 같이 쓴다.
export function DocsHeader({ active, query, onOpenMenu }: DocsHeaderProps) {
  const navCls = (key: DocsSection) => (active === key ? "font-medium text-foreground" : "hover:text-foreground");
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 lg:px-6">
        {onOpenMenu && (
          <button type="button" aria-label="메뉴" className="rounded-lg p-1.5 hover:bg-accent lg:hidden" onClick={onOpenMenu}>
            <Menu className="size-5" />
          </button>
        )}
        <Link href={meerkitConfig.routes.home} className="flex items-center gap-2 text-sm font-semibold">
          <LogoMark className="size-8 rounded-xl" /> Meerkit
        </Link>
        <nav className="ml-4 hidden items-center gap-5 text-[13px] text-muted-foreground md:flex">
          <Link href={meerkitConfig.routes.home} className="hover:text-foreground">Home</Link>
          <Link href="/docs" className={navCls("docs")}>Docs</Link>
          <Link href="/docs/components" className={navCls("components")}>Components</Link>
          <Link href="/docs/api-overview" className={navCls("api")}>API</Link>
          <Link href="/admin-docs" className={navCls("admin")}>Admin</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <HeaderSearch key={query ?? ""} initial={query} />
          <Button asChild size="sm" variant="outline">
            <a href={meerkitConfig.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
