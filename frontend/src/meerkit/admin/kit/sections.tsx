import type { ComponentType } from "react";

import { AuditTab, CodesTab, EmailTab, MembersTab } from "./sections-a";
import { BoardsTab, PermissionsTab, ProfanityTab } from "./sections-b";
import { StatsTab, SystemTab, TermsTab } from "./sections-c";

export type AdminSectionId = "members" | "audit" | "codes" | "email" | "profanity" | "boards" | "permissions" | "terms" | "system" | "stats";

export interface AdminSection {
  id: AdminSectionId;
  label: string;
  /** 섹션이 그리는 내용. 틀(레이아웃)이 사이드바인지 탭인지는 모른다 */
  Content: ComponentType;
}

/** 관리자 섹션 목록. 레이아웃은 이 목록의 일부를 받아 틀에 담는다. */
export const ADMIN_SECTIONS: AdminSection[] = [
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
];
