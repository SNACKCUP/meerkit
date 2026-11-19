"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AdminSectionId } from "../kit/sections";
import { OWNER_LABEL, SECTION_CATALOG, STATUS_LABEL, SUPPLY_LABEL, requiredBy, type SectionMeta } from "./catalog";

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "brand" | "warn" }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "warn" && "bg-destructive/10 text-destructive",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function SectionCard({ meta, checked, lockedBy, onToggle }: { meta: SectionMeta; checked: boolean; lockedBy: string[]; onToggle: () => void }) {
  const locked = lockedBy.length > 0;
  return (
    <li className={cn("grid gap-3 rounded-2xl border bg-surface p-4 shadow-soft transition-colors", checked && "border-brand/60 bg-brand/5")}>
      <label className={cn("flex items-start gap-3", locked ? "cursor-not-allowed" : "cursor-pointer")}>
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={locked} onChange={onToggle} data-testid={`section-${meta.id}`} />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50",
            checked ? "border-brand bg-brand text-white" : "bg-background",
          )}
        >
          {checked && <Check className="size-3.5" />}
        </span>
        <span className="grid gap-1">
          <span className="text-[15px] font-semibold">{meta.label}</span>
          <span className="text-[13px] leading-5 text-muted-foreground">{meta.summary}</span>
        </span>
      </label>

      <div className="flex flex-wrap gap-1.5">
        <Chip tone={meta.owner === "kit" ? "brand" : "muted"}>{OWNER_LABEL[meta.owner].badge}</Chip>
        <Chip>{SUPPLY_LABEL[meta.supply]}</Chip>
        <Chip tone={meta.status === "connected" ? "brand" : "warn"}>{STATUS_LABEL[meta.status]}</Chip>
      </div>

      {locked && <p className="text-xs text-muted-foreground">{lockedBy.join(", ")} 섹션이 필요로 해서 뺄 수 없습니다.</p>}
      {meta.requires.length > 0 && (
        <p className="text-xs text-muted-foreground">
          함께 담김: {meta.requires.map((r) => SECTION_CATALOG.find((s) => s.id === r)?.label).join(", ")}
        </p>
      )}

      <details className="group text-[13px]">
        <summary className="cursor-pointer select-none text-muted-foreground transition-colors hover:text-foreground">성분표 보기</summary>
        <dl className="mt-2 grid gap-2 rounded-xl bg-muted/50 p-3 leading-5">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">데이터 주인</dt>
            <dd>{OWNER_LABEL[meta.owner].hint}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">테이블</dt>
            <dd>{meta.tables.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">서버에 있는 API</dt>
            <dd>{meta.api.length ? <ul className="font-mono text-xs">{meta.api.map((a) => <li key={a}>{a}</li>)}</ul> : "아직 없음"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">참고</dt>
            <dd>{meta.note}</dd>
          </div>
        </dl>
      </details>
    </li>
  );
}

interface SectionCatalogProps {
  selected: AdminSectionId[];
  onToggle: (id: AdminSectionId) => void;
}

/** 장바구니의 상품 목록. 섹션을 체크해서 담는다. */
export function SectionCatalog({ selected, onToggle }: SectionCatalogProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SECTION_CATALOG.map((meta) => (
        <SectionCard key={meta.id} meta={meta} checked={selected.includes(meta.id)} lockedBy={requiredBy(meta.id, selected)} onToggle={() => onToggle(meta.id)} />
      ))}
    </ul>
  );
}
