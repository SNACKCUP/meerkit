import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { meerkitConfig } from "@/meerkit";
import { AdminKit } from "@/meerkit/admin/kit/AdminKit";

export const metadata: Metadata = { title: "관리자 템플릿", robots: { index: false, follow: false } };

// 관리자 템플릿 미리보기. 설명서(/docs)를 여는 앱에서만 열리고, 데이터는 목 데이터다.
export default function Page() {
  if (!meerkitConfig.showDocsPage) notFound();
  return (
    <main className="mk-rise mx-auto max-w-6xl px-4 py-8">
      <AdminKit backHref="/docs/admin-template" backLabel="문서로" />
    </main>
  );
}
