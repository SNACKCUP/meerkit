import type { AdminSectionId } from "../kit/sections";

/** 데이터 주인. A: 킷이 데이터를 가짐 / B: 서비스 데이터에 의존(킷은 화면과 연결 자리만 줌) */
export type DataOwner = "kit" | "service";

/**
 * 테이블을 누가 어떻게 주는지
 * provided: 킷이 이미 제공 / extend: 테이블은 있으나 칸을 더해야 함 / new: 새 테이블이 필요 / service: 서비스가 자기 테이블에 연결
 */
export type TableSupply = "provided" | "extend" | "new" | "service";

/** connected: 서버(API)와 연결됨 / mock: 화면만 있고 데이터는 목 */
export type SectionStatus = "connected" | "mock";

export interface SectionMeta {
  id: AdminSectionId;
  label: string;
  summary: string;
  owner: DataOwner;
  supply: TableSupply;
  /** 이 섹션이 쓰는(또는 쓰게 될) 테이블. 없으면 빈 배열 */
  tables: string[];
  /** 서버에 실제로 있는 API. 아직 없으면 빈 배열 */
  api: string[];
  status: SectionStatus;
  /** 함께 담겨야 하는 섹션 */
  requires: AdminSectionId[];
  /** 성분표에 더 적을 말 */
  note: string;
}

/**
 * 섹션 성분표 (제안 초안).
 * 테이블과 API는 2026-11-18 기준 backend 코드(models.py, api-spec.json)에서 확인한 것만 적었다.
 * 서버에 아직 없는 것은 api를 비우고 status를 mock으로 둔다.
 */
export const SECTION_CATALOG: SectionMeta[] = [
  {
    id: "members",
    label: "회원",
    summary: "회원 목록, 잠긴 계정, 탈퇴 회원. 검색과 역할·상태 필터, 계정 잠금과 해제",
    owner: "kit",
    supply: "provided",
    tables: ["users", "roles", "user_roles"],
    api: ["GET /api/users", "GET /api/users/roles", "PUT /api/users/{user_id}/roles", "PATCH /api/users/{user_id}/active", "DELETE /api/users/{user_id}"],
    status: "connected",
    requires: [],
    note: "서버와 연결된 MemberDirectory 컴포넌트가 따로 있습니다. 이 섹션의 화면은 목 데이터입니다.",
  },
  {
    id: "codes",
    label: "공통 코드",
    summary: "코드 묶음별 값 확인, 추가, 사용 여부 켜고 끄기",
    owner: "kit",
    supply: "provided",
    tables: ["common_code_groups", "common_codes"],
    api: ["GET /api/admin/codes", "POST /api/admin/codes/{group_code}", "PATCH /api/admin/codes/{group_code}/{code}"],
    status: "connected",
    requires: [],
    note: "서비스 분류값은 owner 접두어(SVC 등)로 구분합니다.",
  },
  {
    id: "terms",
    label: "약관",
    summary: "약관 버전 목록, 새 버전 작성과 시행일 예약",
    owner: "kit",
    supply: "extend",
    tables: ["terms", "user_term_agreements"],
    api: [],
    status: "mock",
    requires: [],
    note: "terms 테이블에는 제목·버전·필수 여부만 있습니다. 본문과 시행일 칸을 더하고 관리자 API를 만들어야 합니다.",
  },
  {
    id: "audit",
    label: "감사 로그",
    summary: "전체 로그, 권한 변경, 로그인 이력. 날짜·관리자·행위 필터와 CSV 내보내기",
    owner: "kit",
    supply: "new",
    tables: ["audit_logs (새로 필요)"],
    api: [],
    status: "mock",
    requires: [],
    note: "기록을 남기는 지점(역할 변경, 로그인 등)을 정해야 합니다. 개인정보는 로그에 남기지 않는 규칙을 따릅니다.",
  },
  {
    id: "email",
    label: "이메일",
    summary: "메일 템플릿 목록, 제목·본문 편집, 변수 안내, 테스트 발송",
    owner: "kit",
    supply: "new",
    tables: ["mail_templates (새로 필요)"],
    api: [],
    status: "mock",
    requires: [],
    note: "발송은 app.mail의 send_mail로만 합니다. 템플릿을 저장할 테이블이 아직 없습니다.",
  },
  {
    id: "profanity",
    label: "비속어",
    summary: "금칙어 사전과 예외 단어, 처리 방식(마스킹·차단·검토)",
    owner: "kit",
    supply: "new",
    tables: ["badwords (새로 필요)"],
    api: [],
    status: "mock",
    requires: [],
    note: "금칙어를 어디에서 검사할지(저장 시점)는 서비스가 정해야 합니다.",
  },
  {
    id: "permissions",
    label: "권한",
    summary: "역할별 권한 표, 관리자 계정 추가·해제",
    owner: "kit",
    supply: "new",
    tables: ["permissions, role_permissions (향후 확장)"],
    api: [],
    status: "mock",
    requires: ["members"],
    note: "역할별 세부 권한은 아직 정하지 않았습니다(docs/future-extensions.md). 역할 부여는 회원 섹션이 함께 필요합니다.",
  },
  {
    id: "system",
    label: "시스템",
    summary: "서비스 기본 정보, 로그인 실패 허용 횟수와 잠금 시간, 점검 모드",
    owner: "kit",
    supply: "new",
    tables: ["설정 저장 위치 미정"],
    api: [],
    status: "mock",
    requires: [],
    note: "지금 이 값들은 환경 변수와 설정 파일에 있습니다. 화면에서 바꾸려면 저장 위치를 먼저 정해야 합니다.",
  },
  {
    id: "boards",
    label: "게시판",
    summary: "게시판 목록, 게시물 숨김, 신고 승인·반려",
    owner: "service",
    supply: "service",
    tables: ["서비스의 게시물, 신고 테이블"],
    api: [],
    status: "mock",
    requires: [],
    note: "킷은 서비스 코드를 import하지 않아서 서비스 테이블을 알 수 없습니다. 화면만 주고 연결은 서비스가 합니다.",
  },
  {
    id: "stats",
    label: "접속 통계",
    summary: "방문자, DAU, MAU, 평균 체류와 방문자 차트",
    owner: "service",
    supply: "service",
    tables: ["서비스가 쌓는 접속 기록"],
    api: [],
    status: "mock",
    requires: [],
    note: "사용량 추적 코드는 이번 킷 범위가 아닙니다(저장소 규칙). 화면만 제공하고 집계는 서비스가 연결합니다.",
  },
];

export const OWNER_LABEL: Record<DataOwner, { badge: string; hint: string }> = {
  kit: { badge: "A · 킷이 데이터 보유", hint: "킷이 테이블, API, 화면을 모두 제공합니다 (제공 전인 것은 상태로 구분)" },
  service: { badge: "B · 서비스 데이터", hint: "킷은 화면만 주고, 서비스가 자기 API와 테이블을 연결합니다" },
};

export const SUPPLY_LABEL: Record<TableSupply, string> = {
  provided: "테이블 제공",
  extend: "테이블 칸 추가 필요",
  new: "새 테이블 필요",
  service: "서비스 테이블에 연결",
};

export const STATUS_LABEL: Record<SectionStatus, string> = {
  connected: "서버 연결됨",
  mock: "화면만 (목 데이터)",
};

/** 체크한 섹션에 함께 담아야 하는 섹션까지 넣은 id 목록 (카탈로그 순서) */
export function withRequired(selected: AdminSectionId[]): AdminSectionId[] {
  const set = new Set<AdminSectionId>(selected);
  for (const id of selected) for (const r of SECTION_CATALOG.find((s) => s.id === id)?.requires ?? []) set.add(r);
  return SECTION_CATALOG.map((s) => s.id).filter((id) => set.has(id));
}

/** 이 섹션을 필요로 하는, 이미 담긴 섹션의 이름들 (있으면 이 섹션은 뺄 수 없다) */
export function requiredBy(id: AdminSectionId, selected: AdminSectionId[]): string[] {
  return SECTION_CATALOG.filter((s) => selected.includes(s.id) && s.requires.includes(id)).map((s) => s.label);
}

/** 체크 결과로 만든 명령. add admin 명령은 아직 구현되지 않았다 (화면에 "예정"으로 표시한다) */
export function buildCommand(selected: AdminSectionId[], layout: "sidebar" | "tabs"): string {
  const sections = selected.length ? selected.join(" ") : "<섹션>";
  return `npx @snackcup/meerkit add admin ${sections} --layout ${layout}`;
}
