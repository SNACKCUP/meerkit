"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { AdminKit } from "../../admin/kit/AdminKit";
import { Callout, CodeBlock, DocTable, H2, Ic, P, PreviewWide, UL } from "../ui";

const TABS: [string, string, string][] = [
  ["회원", "회원 목록 · 잠긴 계정 · 탈퇴 회원", "이름·이메일 검색, 역할·상태 필터, 계정 잠금과 해제, 탈퇴 회원 복구"],
  ["감사 로그", "전체 로그 · 권한 변경 · 로그인 이력", "날짜·관리자·행위 필터, 목록을 CSV 파일로 내려받기"],
  ["공통 코드", "코드 묶음 목록", "묶음별 코드 확인, 코드 추가, 사용 여부 켜고 끄기"],
  ["이메일", "메일 템플릿 목록", "제목·본문 편집, 쓸 수 있는 변수 안내, 테스트 발송, 저장"],
  ["비속어", "금칙어 사전 · 예외 단어", "단어 추가·삭제, 처리 방식 선택(마스킹·차단·검토), 등록 현황 카드"],
  ["게시판", "게시판 목록 · 게시물 관리 · 신고 처리", "게시판 만들기와 사용 여부, 게시물 숨김, 신고 승인·반려"],
  ["권한", "역할별 권한 · 관리자 계정", "역할×권한 표에서 칸을 눌러 켜고 끄기, 관리자 추가·해제"],
  ["약관", "약관 버전 목록", "새 버전 작성과 시행일 예약, 시행 상태 확인"],
  ["시스템", "기본 정보 · 보안 · 점검 모드", "서비스 이름·대표 이메일, 로그인 실패 허용 횟수·잠금 시간, 점검 모드"],
  ["접속 통계", "일별 · 주별 · 월별", "방문자·DAU·MAU·평균 체류 카드와 방문자 막대 차트"],
];

export function AdminTemplateDoc() {
  return (
    <>
      <P>
        서비스에 바로 가져다 쓸 수 있는 <strong>관리자 화면 템플릿</strong>입니다. 회원, 감사 로그, 공통 코드, 이메일, 비속어, 게시판, 권한, 약관, 시스템, 접속 통계 10개 탭이 한 틀에 담겨 있습니다.
        아래 미리보기에서 탭을 눌러 보고, 화면 전체로 보려면 버튼을 누르세요.
      </P>
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/kit">전체 화면으로 열기 <ExternalLink /></Link>
        </Button>
      </div>
      <Callout>
        <strong>현재 프론트 UI만 작업된 상태입니다.</strong> 미리보기의 데이터는 목(mock) 데이터이고, 저장·삭제·CSV 내보내기는 이 화면 안에서만 동작합니다. 서버(API)와는 연결되어 있지 않습니다.
      </Callout>

      <H2>Preview</H2>
      <PreviewWide code={`import { AdminKit } from "@/meerkit";\n\nexport default function Page() {\n  return <AdminKit serviceName="내 서비스" backHref="/" />;\n}`}>
        <AdminKit backHref="/docs/admin-template" backLabel="문서로" />
      </PreviewWide>

      <H2>탭 구성</H2>
      <DocTable head={["탭", "하위 화면", "할 수 있는 일"]} rows={TABS.map(([tab, sub, what]) => [<strong key={tab}>{tab}</strong>, sub, what])} />

      <H2>Usage</H2>
      <P>
        <Ic>AdminKit</Ic>을 화면에 놓으면 됩니다. 관리자만 볼 수 있게 하려면 <Ic>RequireRole</Ic>로 감싸세요.
      </P>
      <CodeBlock
        title="app/(service)/admin/page.tsx"
        code={`
import { AdminKit, RequireRole } from "@/meerkit";

export default function Page() {
  return (
    <RequireRole role="MASTER">
      <AdminKit serviceName="내 서비스" backHref="/" />
    </RequireRole>
  );
}
`}
      />

      <H2>Props</H2>
      <DocTable
        head={["이름", "타입", "기본값", "설명"]}
        rows={[
          [<Ic key="a">serviceName</Ic>, "string", <Ic key="a2">&quot;Meerkit&quot;</Ic>, "헤더 왼쪽에 보이는 서비스 이름"],
          [<Ic key="b">backHref</Ic>, "string", <Ic key="b2">&quot;/&quot;</Ic>, "오른쪽 위 \"서비스로\" 링크가 가는 주소"],
          [<Ic key="c">backLabel</Ic>, "string", <Ic key="c2">&quot;서비스로&quot;</Ic>, "그 링크의 글자"],
          [<Ic key="d">className</Ic>, "string", "-", "바깥 틀에 더할 클래스"],
        ]}
      />

      <H2>서버와 연결하려면</H2>
      <UL>
        <li>각 탭의 목 데이터는 <Ic>admin/kit/mock.ts</Ic>에 모여 있습니다. 탭 안의 <Ic>useState</Ic> 초기값을 API 결과로 바꾸면 됩니다.</li>
        <li>멤버 목록은 이미 서버와 연결된 <Ic>MemberDirectory</Ic> 컴포넌트가 따로 있습니다. 실제 회원 관리에는 그것을 쓰세요.</li>
        <li>색은 킷 토큰(<Ic>brand</Ic>, <Ic>destructive</Ic>, <Ic>muted</Ic>)만 쓰므로 테마를 바꾸면 함께 바뀝니다.</li>
      </UL>
    </>
  );
}
