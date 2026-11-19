"use client";

import { ShoppingCart, TriangleAlert } from "lucide-react";

import { PkgTabs } from "../../docs/ui";
import type { AdminSectionId } from "../kit/sections";
import type { AdminLayoutKind } from "../layouts/types";
import { SECTION_CATALOG, buildCommand } from "./catalog";

const LAYOUT_NAME: Record<AdminLayoutKind, string> = { sidebar: "사이드바형", tabs: "탭형" };

interface CartPanelProps {
  selected: AdminSectionId[];
  layout: AdminLayoutKind;
  onClear: () => void;
}

/** 장바구니. 담은 섹션과 레이아웃을 요약하고, 그에 맞는 명령을 보여 준다. */
export function CartPanel({ selected, layout, onClear }: CartPanelProps) {
  const metas = SECTION_CATALOG.filter((s) => selected.includes(s.id));
  const connected = metas.filter((m) => m.status === "connected").length;
  const serviceSide = metas.filter((m) => m.owner === "service").length;
  const needTables = metas.filter((m) => m.supply === "new" || m.supply === "extend").length;

  return (
    <section aria-label="장바구니" className="grid gap-4 rounded-2xl border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <ShoppingCart className="size-4 text-brand" /> 장바구니
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground" data-testid="cart-count">{metas.length}</span>
        </h2>
        <button type="button" onClick={onClear} disabled={metas.length === 0} className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
          비우기
        </button>
      </div>

      {metas.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">왼쪽에서 필요한 섹션을 체크하면 여기에 담깁니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {metas.map((m) => (
            <li key={m.id} className="rounded-lg bg-brand/10 px-2 py-1 text-xs font-medium text-brand">{m.label}</li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <dt className="text-muted-foreground">레이아웃</dt>
        <dd className="text-right font-medium">{LAYOUT_NAME[layout]}</dd>
        <dt className="text-muted-foreground">서버에 연결된 섹션</dt>
        <dd className="text-right font-medium">{connected}개</dd>
        <dt className="text-muted-foreground">서비스가 연결할 섹션</dt>
        <dd className="text-right font-medium">{serviceSide}개</dd>
        <dt className="text-muted-foreground">테이블·마이그레이션 작업 필요</dt>
        <dd className="text-right font-medium">{needTables}개</dd>
      </dl>

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-muted-foreground">명령</p>
        <PkgTabs wrap command={buildCommand(selected, layout)} />
        <p className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5" data-testid="command-notice">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <span>
            <strong>예정</strong> — <code>add admin</code> 명령은 아직 구현되지 않았습니다. 지금은 구성을 미리 확인하는 화면이고, 복사해서 실행하면 동작하지 않습니다. 지금 쓰는 방법은 아래 &quot;지금 바로 쓰기&quot;를 보세요.
          </span>
        </p>
      </div>
    </section>
  );
}
