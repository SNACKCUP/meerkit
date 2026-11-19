"use client";

import { AdminSidebarLayout } from "../layouts/AdminSidebarLayout";
import { AdminTabsLayout } from "../layouts/AdminTabsLayout";
import type { AdminLayoutKind } from "../layouts/types";
import { ADMIN_SECTIONS } from "./sections";

interface AdminKitProps {
  /** 서비스 이름. 헤더 왼쪽에 보인다 */
  serviceName?: string;
  /** "서비스로" 링크가 가는 주소 */
  backHref?: string;
  backLabel?: string;
  /** 틀의 모양. 탭형(기본) 또는 사이드바형 */
  layout?: AdminLayoutKind;
  className?: string;
}

/**
 * 관리자 화면 템플릿. 회원·감사 로그·공통 코드 등 10개 섹션을 한 틀에 담았다.
 * 프론트 UI만 제공하며 데이터는 목(mock)이다. 서버와 연결하려면 각 섹션의 목 데이터를 API 결과로 바꾼다.
 * 틀은 layout으로 고른다 (섹션 내용은 같고 틀만 바뀐다).
 */
export function AdminKit({ layout = "tabs", ...props }: AdminKitProps) {
  const Layout = layout === "sidebar" ? AdminSidebarLayout : AdminTabsLayout;
  return <Layout items={ADMIN_SECTIONS} {...props} />;
}
