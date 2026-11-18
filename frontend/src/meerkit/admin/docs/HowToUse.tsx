import { CodeBlock, DocTable, H2, Ic, OL, P, UL } from "../../docs/ui";

const FLOW: [string, string, "가능" | "예정"][] = [
  ["상단 메뉴의 Admin에서 이 페이지를 연다", "이 페이지", "가능"],
  ["필요한 섹션을 체크한다 (함께 필요한 섹션은 자동으로 담긴다)", "장바구니", "가능"],
  ["레이아웃을 고르고 실제 화면으로 미리 본다", "레이아웃 미리보기", "가능"],
  ["담은 구성에 맞는 명령을 복사해 실행한다", "add admin 명령", "예정"],
  ["서비스의 /admin에 고른 섹션과 레이아웃이 만들어진다", "add admin 명령", "예정"],
  ["킷 업데이트는 npx @snackcup/meerkit update 로 받는다", "update 명령", "가능"],
];

/** 이 페이지를 어떻게 쓰는지, 그리고 지금 바로 할 수 있는 방법 */
export function HowToUse() {
  return (
    <div className="grid gap-5">
      <H2 id="flow">이 페이지를 쓰는 순서</H2>
      <DocTable
        head={["순서", "단계", "어디서", "상태"]}
        rows={FLOW.map(([step, where, state], i) => [
          String(i + 1),
          step,
          where,
          <span key={step} className={state === "가능" ? "font-medium text-brand" : "font-medium text-destructive"}>{state}</span>,
        ])}
      />
      <P>
        <strong>예정</strong>으로 표시한 단계는 아직 만들어지지 않았습니다. 아래 &quot;지금 바로 쓰기&quot;로 같은 화면을 직접 가져다 쓸 수 있습니다.
      </P>

      <H2 id="use-now">지금 바로 쓰기</H2>
      <P>
        <Ic>AdminKit</Ic>을 화면에 놓으면 10개 섹션이 한 틀에 담겨 나옵니다. <Ic>layout</Ic>으로 틀을 고릅니다. 관리자만 볼 수 있게 하려면 <Ic>RequireRole</Ic>로 감싸세요.
      </P>
      <CodeBlock
        title="app/(service)/admin/page.tsx"
        code={`
import { AdminKit, RequireRole } from "@/meerkit";

export default function Page() {
  return (
    <RequireRole role="MASTER">
      <AdminKit layout="sidebar" serviceName="내 서비스" backHref="/" />
    </RequireRole>
  );
}
`}
      />
      <DocTable
        head={["이름", "타입", "기본값", "설명"]}
        rows={[
          [<Ic key="a">layout</Ic>, <Ic key="a1">&quot;tabs&quot; | &quot;sidebar&quot;</Ic>, <Ic key="a2">&quot;tabs&quot;</Ic>, "틀의 모양. 섹션 내용은 같고 틀만 바뀝니다"],
          [<Ic key="b">serviceName</Ic>, "string", <Ic key="b2">&quot;Meerkit&quot;</Ic>, "헤더 왼쪽에 보이는 서비스 이름"],
          [<Ic key="c">backHref</Ic>, "string", <Ic key="c2">&quot;/&quot;</Ic>, "오른쪽 위 \"서비스로\" 링크가 가는 주소"],
          [<Ic key="d">backLabel</Ic>, "string", <Ic key="d2">&quot;서비스로&quot;</Ic>, "그 링크의 글자"],
          [<Ic key="e">className</Ic>, "string", "-", "바깥 틀에 더할 클래스"],
        ]}
      />

      <H2 id="connect">서버와 연결하려면</H2>
      <UL>
        <li>
          지금 <Ic>AdminKit</Ic>의 섹션 데이터는 목(mock)입니다. 저장·삭제·CSV 내보내기는 화면 안에서만 동작하고 서버와 연결되어 있지 않습니다. 목 데이터는 <Ic>admin/kit/mock.ts</Ic>에 모여 있습니다.
        </li>
        <li>
          서버와 이미 연결된 것은 회원 목록(<Ic>MemberDirectory</Ic> 컴포넌트)과 공통 코드 API입니다. 실제 회원 관리에는 <Ic>MemberDirectory</Ic>를 쓰세요.
        </li>
        <li>성분표의 &quot;서버에 있는 API&quot;가 &quot;아직 없음&quot;인 섹션은 화면만 있습니다. 서비스가 API를 만들어 연결해야 합니다.</li>
        <li>색은 킷 토큰(<Ic>brand</Ic>, <Ic>destructive</Ic>, <Ic>muted</Ic>)만 쓰므로 테마를 바꾸면 함께 바뀝니다.</li>
      </UL>

      <H2 id="manifest">성분표란</H2>
      <P>섹션마다 &quot;무엇이 들어 있는지&quot;를 적은 목록입니다. 장바구니의 &quot;성분표 보기&quot;에서 볼 수 있습니다.</P>
      <OL>
        <li><strong>데이터 주인</strong>: A는 킷이 데이터를 가지고, B는 서비스 데이터에 의존합니다.</li>
        <li><strong>테이블</strong>: 킷이 이미 제공하는지, 칸을 더해야 하는지, 새로 만들어야 하는지.</li>
        <li><strong>서버에 있는 API</strong>: 실제로 있는 것만 적습니다.</li>
        <li><strong>상태</strong>: 서버와 연결됐는지, 화면만 있는지.</li>
      </OL>
      <P>이 성분표는 현재 제안 초안이며 팀 회의에서 칸을 확정할 예정입니다.</P>
    </div>
  );
}
