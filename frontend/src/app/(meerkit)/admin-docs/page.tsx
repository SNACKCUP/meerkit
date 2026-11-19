import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { meerkitConfig } from "@/meerkit";
import { AdminDocsPage } from "@/meerkit/admin/docs/AdminDocsPage";

export const metadata: Metadata = {
  title: "Admin",
  description: "관리자 키트. 필요한 섹션과 레이아웃을 장바구니처럼 골라 실제 화면으로 미리 봅니다.",
  alternates: { canonical: "/admin-docs" },
};

// 관리자 키트 전용 문서. 설명서(/docs)를 여는 앱에서만 열리고, 데이터는 목 데이터다.
export default function Page() {
  if (!meerkitConfig.showDocsPage) notFound();
  return <AdminDocsPage />;
}
