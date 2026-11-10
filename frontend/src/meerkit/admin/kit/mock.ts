/** 관리자 킷 미리보기용 목 데이터. 서버와 연결하지 않으며, 실제 서비스에서는 props로 교체한다. */

export const KIT_ROLES = ["MASTER", "OWNER", "WRITER", "VIEWER"] as const;
export type KitRole = (typeof KIT_ROLES)[number];

export type MemberStatus = "active" | "locked" | "withdrawn";

export interface KitMember {
  id: number;
  name: string;
  email: string;
  role: KitRole;
  joinedAt: string;
  status: MemberStatus;
}

export const initialMembers: KitMember[] = [
  { id: 1, name: "김미어", email: "kim@meerkit.dev", role: "MASTER", joinedAt: "2026-03-02", status: "active" },
  { id: 2, name: "이킷", email: "lee@meerkit.dev", role: "OWNER", joinedAt: "2026-05-18", status: "active" },
  { id: 3, name: "박작성", email: "park@meerkit.dev", role: "WRITER", joinedAt: "2026-08-09", status: "locked" },
  { id: 4, name: "최보기", email: "choi@meerkit.dev", role: "VIEWER", joinedAt: "2026-11-01", status: "active" },
  { id: 5, name: "정다온", email: "jung@meerkit.dev", role: "WRITER", joinedAt: "2026-09-14", status: "locked" },
  { id: 6, name: "한솔", email: "han@meerkit.dev", role: "VIEWER", joinedAt: "2026-04-21", status: "withdrawn" },
];

export type AuditKind = "role" | "login" | "etc";

export interface AuditRow {
  at: string;
  admin: string;
  action: string;
  target: string;
  ip: string;
  kind: AuditKind;
}

export const auditRows: AuditRow[] = [
  { at: "11-09 16:52", admin: "김미어", action: "역할 변경 WRITER→OWNER", target: "이킷", ip: "10.0.0.12", kind: "role" },
  { at: "11-09 15:10", admin: "김미어", action: "계정 잠금 해제", target: "박작성", ip: "10.0.0.12", kind: "etc" },
  { at: "11-09 11:03", admin: "이킷", action: "약관 v3 게시", target: "이용약관", ip: "10.0.0.31", kind: "etc" },
  { at: "11-09 09:41", admin: "김미어", action: "로그인", target: "-", ip: "10.0.0.12", kind: "login" },
  { at: "11-08 18:40", admin: "김미어", action: "비속어 3건 추가", target: "비속어 사전", ip: "10.0.0.12", kind: "etc" },
  { at: "11-08 10:22", admin: "이킷", action: "로그인", target: "-", ip: "10.0.0.31", kind: "login" },
  { at: "11-07 14:05", admin: "김미어", action: "역할 변경 VIEWER→WRITER", target: "정다온", ip: "10.0.0.12", kind: "role" },
];

export interface CommonCode {
  code: string;
  name: string;
  order: number;
  enabled: boolean;
}

export const initialCodeGroups: Record<string, { label: string; codes: CommonCode[] }> = {
  MEMBER_STATUS: {
    label: "회원 상태",
    codes: [
      { code: "ACTIVE", name: "활성", order: 1, enabled: true },
      { code: "LOCKED", name: "잠김", order: 2, enabled: true },
      { code: "DORMANT", name: "휴면", order: 3, enabled: true },
      { code: "WITHDRAWN", name: "탈퇴", order: 4, enabled: false },
    ],
  },
  ROLE: {
    label: "역할",
    codes: [
      { code: "MASTER", name: "마스터", order: 1, enabled: true },
      { code: "OWNER", name: "오너", order: 2, enabled: true },
      { code: "WRITER", name: "작성자", order: 3, enabled: true },
      { code: "VIEWER", name: "열람자", order: 4, enabled: true },
    ],
  },
  GENDER: {
    label: "성별",
    codes: [
      { code: "M", name: "남성", order: 1, enabled: true },
      { code: "F", name: "여성", order: 2, enabled: true },
      { code: "N", name: "선택 안 함", order: 3, enabled: true },
    ],
  },
  BOARD_TYPE: {
    label: "게시판 유형",
    codes: [
      { code: "NOTICE", name: "공지", order: 1, enabled: true },
      { code: "GENERAL", name: "일반", order: 2, enabled: true },
      { code: "FAQ", name: "FAQ", order: 3, enabled: true },
      { code: "QNA", name: "Q&A", order: 4, enabled: true },
    ],
  },
  EMAIL_TYPE: {
    label: "이메일 유형",
    codes: [
      { code: "SIGNUP", name: "회원가입 인증", order: 1, enabled: true },
      { code: "RESET", name: "비밀번호 재설정", order: 2, enabled: true },
      { code: "LOCK", name: "계정 잠금 안내", order: 3, enabled: true },
      { code: "TERMS", name: "약관 변경 안내", order: 4, enabled: true },
    ],
  },
};

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const initialEmailTemplates: EmailTemplate[] = [
  { id: "signup", name: "회원가입 인증", subject: "[미어킷] 이메일 인증번호 안내", body: "{{name}}님, 가입을 환영합니다.\n인증번호는 {{code}} 입니다. (5분 동안 유효)", variables: ["{{name}}", "{{code}}"] },
  { id: "reset", name: "비밀번호 재설정", subject: "[미어킷] 비밀번호 재설정 안내", body: "{{name}}님, 아래 링크에서 비밀번호를 다시 설정하세요.\n{{reset_link}}  (30분 동안 유효)", variables: ["{{name}}", "{{reset_link}}"] },
  { id: "lock", name: "계정 잠금 안내", subject: "[미어킷] 계정이 잠겼습니다", body: "{{name}}님, 로그인에 연속으로 실패해 계정이 잠겼습니다.\n{{unlock_at}} 이후에 다시 시도해 주세요.", variables: ["{{name}}", "{{unlock_at}}"] },
  { id: "terms", name: "약관 변경 안내", subject: "[미어킷] 약관이 변경됩니다", body: "{{name}}님, {{effective_date}}부터 새 약관이 적용됩니다.\n자세한 내용은 {{terms_link}} 에서 확인하세요.", variables: ["{{name}}", "{{effective_date}}", "{{terms_link}}"] },
];

export const profanityDefaults = ["비속어A", "비속어B", "비속어C", "욕설D", "혐오E", "광고F", "도배G"];
export const profanityExceptionDefaults = ["시발점", "개나리"];
export const PROFANITY_ACTIONS = ["마스킹(***)", "게시 차단", "관리자 검토로 보내기"] as const;

export interface KitBoard {
  id: number;
  name: string;
  type: string;
  writeRole: string;
  comments: boolean;
  posts: number;
  enabled: boolean;
}

export const initialBoards: KitBoard[] = [
  { id: 1, name: "공지사항", type: "공지", writeRole: "MASTER", comments: false, posts: 24, enabled: true },
  { id: 2, name: "자유게시판", type: "일반", writeRole: "WRITER 이상", comments: true, posts: 1032, enabled: true },
  { id: 3, name: "FAQ", type: "FAQ", writeRole: "OWNER 이상", comments: false, posts: 41, enabled: true },
  { id: 4, name: "질문답변", type: "Q&A", writeRole: "VIEWER 이상", comments: true, posts: 288, enabled: false },
];

export interface KitPost {
  id: number;
  board: string;
  title: string;
  author: string;
  createdAt: string;
  hidden: boolean;
}

export const initialPosts: KitPost[] = [
  { id: 101, board: "공지사항", title: "11월 정기 점검 안내", author: "김미어", createdAt: "11-08", hidden: false },
  { id: 102, board: "자유게시판", title: "오늘 점심 뭐 드셨어요?", author: "박작성", createdAt: "11-09", hidden: false },
  { id: 103, board: "자유게시판", title: "광고 문의드립니다 (링크)", author: "정다온", createdAt: "11-09", hidden: true },
  { id: 104, board: "FAQ", title: "비밀번호를 잊어버렸어요", author: "이킷", createdAt: "11-05", hidden: false },
];

export type ReportStatus = "pending" | "accepted" | "rejected";

export interface KitReport {
  id: number;
  target: string;
  reason: string;
  reporter: string;
  at: string;
  status: ReportStatus;
}

export const initialReports: KitReport[] = [
  { id: 1, target: "광고 문의드립니다 (링크)", reason: "광고·스팸", reporter: "최보기", at: "11-09 10:12", status: "pending" },
  { id: 2, target: "댓글: 너무 심한 표현이네요", reason: "욕설·비방", reporter: "이킷", at: "11-09 08:30", status: "pending" },
  { id: 3, target: "오늘 점심 뭐 드셨어요?", reason: "기타", reporter: "한솔", at: "11-08 19:02", status: "rejected" },
];

export const PERMISSIONS = ["회원 관리", "게시판 관리", "게시글 작성", "게시글 조회", "감사 로그 조회", "시스템 설정"] as const;

/** 역할별 기본 권한. 행은 PERMISSIONS 순서와 같다. */
export const initialPermissionMatrix: Record<KitRole, boolean[]> = {
  MASTER: [true, true, true, true, true, true],
  OWNER: [false, true, true, true, false, false],
  WRITER: [false, false, true, true, false, false],
  VIEWER: [false, false, false, true, false, false],
};

export interface KitAdminAccount {
  id: number;
  name: string;
  email: string;
  lastLogin: string;
}

export const initialAdminAccounts: KitAdminAccount[] = [
  { id: 1, name: "김미어", email: "kim@meerkit.dev", lastLogin: "11-09 09:41" },
  { id: 2, name: "이킷", email: "lee@meerkit.dev", lastLogin: "11-08 10:22" },
];

export interface KitTerm {
  id: number;
  title: string;
  version: string;
  required: boolean;
  effectiveAt: string;
  status: "scheduled" | "active";
}

export const initialTerms: KitTerm[] = [
  { id: 1, title: "서비스 이용약관", version: "v3", required: true, effectiveAt: "2026-12-01", status: "scheduled" },
  { id: 2, title: "서비스 이용약관", version: "v2", required: true, effectiveAt: "2026-06-01", status: "active" },
  { id: 3, title: "개인정보처리방침", version: "v2", required: true, effectiveAt: "2026-06-01", status: "active" },
  { id: 4, title: "마케팅 정보 수신", version: "v1", required: false, effectiveAt: "2026-03-01", status: "active" },
];

export type StatsPeriod = "day" | "week" | "month";

export const statsPeriods: { id: StatsPeriod; label: string; chartTitle: string }[] = [
  { id: "day", label: "일별", chartTitle: "최근 7일 방문자" },
  { id: "week", label: "주별", chartTitle: "최근 8주 방문자" },
  { id: "month", label: "월별", chartTitle: "최근 6개월 방문자" },
];

export const statsSeries: Record<StatsPeriod, { label: string; value: number }[]> = {
  day: [
    { label: "11/03", value: 1010 },
    { label: "11/04", value: 1150 },
    { label: "11/05", value: 1100 },
    { label: "11/06", value: 1240 },
    { label: "11/07", value: 960 },
    { label: "11/08", value: 920 },
    { label: "11/09", value: 1284 },
  ],
  week: [
    { label: "9월 4주", value: 6420 },
    { label: "10월 1주", value: 6810 },
    { label: "10월 2주", value: 7020 },
    { label: "10월 3주", value: 6730 },
    { label: "10월 4주", value: 7390 },
    { label: "11월 1주", value: 7650 },
    { label: "11월 2주", value: 7480 },
    { label: "11월 3주", value: 8010 },
  ],
  month: [
    { label: "6월", value: 21400 },
    { label: "7월", value: 23100 },
    { label: "8월", value: 24800 },
    { label: "9월", value: 27050 },
    { label: "10월", value: 29900 },
    { label: "11월", value: 31200 },
  ],
};

export const statsSummary: Record<StatsPeriod, { label: string; value: string; delta: string; down?: boolean }[]> = {
  day: [
    { label: "오늘 방문자", value: "1,284", delta: "+8%" },
    { label: "DAU", value: "932", delta: "+3%" },
    { label: "MAU", value: "12,410", delta: "+12%" },
    { label: "평균 체류", value: "6분 20초", delta: "-1%", down: true },
  ],
  week: [
    { label: "이번 주 방문자", value: "8,010", delta: "+7%" },
    { label: "WAU", value: "4,320", delta: "+5%" },
    { label: "신규 가입", value: "214", delta: "+11%" },
    { label: "평균 체류", value: "6분 05초", delta: "-2%", down: true },
  ],
  month: [
    { label: "이번 달 방문자", value: "31,200", delta: "+4%" },
    { label: "MAU", value: "12,410", delta: "+12%" },
    { label: "신규 가입", value: "902", delta: "+9%" },
    { label: "평균 체류", value: "6분 20초", delta: "+1%" },
  ],
};
