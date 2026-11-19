"use client";

import { useState } from "react";

import { DocsFooter } from "../../docs/DocsFooter";
import { DocsHeader } from "../../docs/DocsHeader";
import { Callout, H2, P } from "../../docs/ui";
import { AdminSidebarLayout } from "../layouts/AdminSidebarLayout";
import { AdminTabsLayout } from "../layouts/AdminTabsLayout";
import type { AdminLayoutKind } from "../layouts/types";
import { ADMIN_SECTIONS, type AdminSectionId } from "../kit/sections";
import { CartPanel } from "./CartPanel";
import { SECTION_CATALOG, withRequired } from "./catalog";
import { HowToUse } from "./HowToUse";
import { LayoutPicker } from "./LayoutPicker";
import { SectionCatalog } from "./SectionCatalog";

/**
 * 관리자 키트 전용 문서. 일반 문서(/docs)와 따로 둔다.
 * 섹션과 레이아웃을 장바구니처럼 고르고, 고른 구성을 실제 화면으로 미리 본다. 데이터는 목이다.
 */
export function AdminDocsPage() {
  const [selected, setSelected] = useState<AdminSectionId[]>(["members", "codes"]);
  const [layout, setLayout] = useState<AdminLayoutKind>("sidebar");

  const toggle = (id: AdminSectionId) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : withRequired([...cur, id])));

  // 카탈로그 순서로 섹션 화면을 모은다
  const items = SECTION_CATALOG.map((m) => ADMIN_SECTIONS.find((s) => s.id === m.id)).filter((s): s is (typeof ADMIN_SECTIONS)[number] => !!s && selected.includes(s.id));
  const Layout = layout === "sidebar" ? AdminSidebarLayout : AdminTabsLayout;

  return (
    <div className="min-h-screen">
      <DocsHeader active="admin" />

      <main className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 lg:px-6">
        <div className="grid max-w-3xl gap-3">
          <p className="text-[13px] font-semibold text-brand">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">관리자 키트</h1>
          <P>
            필요한 관리자 기능과 레이아웃을 장바구니처럼 골라 보세요. 고른 구성이 아래에서 실제 화면으로 바로 보입니다.
          </P>
          <Callout>
            <strong>지금은 화면만 있는 단계입니다.</strong> 미리보기의 데이터는 목(mock)이고, 서버와 연결된 것은 회원과 공통 코드뿐입니다. 장바구니의 명령(<code>add admin</code>)은 아직 구현되지 않았습니다.
          </Callout>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 gap-10">
            <section aria-labelledby="pick-sections" className="grid gap-4">
              <H2 id="pick-sections">1. 섹션 고르기</H2>
              <SectionCatalog selected={selected} onToggle={toggle} />
            </section>

            <section aria-labelledby="pick-layout" className="grid gap-4">
              <H2 id="pick-layout">2. 레이아웃 고르기</H2>
              <LayoutPicker value={layout} onChange={setLayout} />
            </section>

            <section aria-labelledby="preview" className="grid gap-4">
              <H2 id="preview">3. 미리보기</H2>
              <P>고른 섹션 {items.length}개를 {layout === "sidebar" ? "사이드바형" : "탭형"} 틀에 담은 모습입니다. 메뉴를 눌러 보세요.</P>
              <div className="mk-scroll max-h-[760px] overflow-auto rounded-3xl" data-testid="preview">
                {items.length > 0 ? (
                  <Layout items={items} serviceName="내 서비스" backHref="/admin-docs" backLabel="서비스로 (예시)" />
                ) : (
                  <div className="grid place-items-center rounded-3xl border border-dashed p-16 text-sm text-muted-foreground">섹션을 하나 이상 고르면 여기에 화면이 나옵니다.</div>
                )}
              </div>
            </section>

            <HowToUse />
          </div>

          <aside className="lg:sticky lg:top-20">
            <CartPanel selected={selected} layout={layout} onClear={() => setSelected([])} />
          </aside>
        </div>
      </main>

      <DocsFooter />
    </div>
  );
}
