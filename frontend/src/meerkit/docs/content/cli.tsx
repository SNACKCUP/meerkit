"use client";

import { Callout, CodeBlock, DocTable, H2, H3, Ic, LinkCards, OL, P, UL } from "../ui";

const CMD = "npx @snackcup/meerkit";

/** 옵션 표. 옵션이 없으면 그리지 않는다. */
function Options({ rows }: { rows: [string, string][] }) {
  return <DocTable head={["옵션", "설명"]} rows={rows.map(([flag, desc]) => [<Ic key={flag}>{flag}</Ic>, desc])} />;
}

export function CliOverview() {
  return (
    <>
      <P>
        Meerkit CLI(<Ic>@snackcup/meerkit</Ic>)는 프로젝트를 만들고, 세팅하고, 켜고, 점검하는 일을 명령어 하나씩으로 처리합니다. 설치할 필요 없이{" "}
        <Ic>npx</Ic>로 바로 실행합니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} <명령> [옵션]\n${CMD} --help           # 전체 명령 목록\n${CMD} <명령> --help    # 그 명령의 자세한 사용법`} />
      <Callout>
        새 프로젝트는 <Ic>npx create-meerkit my-app</Ic>으로 만들 수도 있습니다. <Ic>{`${CMD} init my-app`}</Ic>과 같은 명령입니다.
      </Callout>

      <H2>명령 한눈에 보기</H2>
      <DocTable
        head={["명령", "하는 일", "설명 페이지"]}
        rows={[
          [<Ic key="init">init</Ic>, "새 프로젝트를 만듭니다", "시작하기"],
          [<Ic key="setup">setup</Ic>, "환경 점검, 설치, DB, 관리자 계정까지 한 번에 세팅하고 서버를 켭니다", "시작하기"],
          [<Ic key="start">start</Ic>, "세팅이 끝난 프로젝트의 서버만 켭니다", "서버"],
          [<Ic key="stop">stop</Ic>, "이 프로젝트의 서버를 끕니다", "서버"],
          [<Ic key="open">open</Ic>, "브라우저로 화면이나 API 문서를 엽니다", "서버"],
          [<Ic key="status">status</Ic>, "DB, 서버, 마이그레이션 상태를 한눈에 봅니다", "점검"],
          [<Ic key="check">check</Ic>, "Node, npm, uv, Docker와 디스크 여유 공간을 점검합니다", "점검"],
          [<Ic key="env">env check</Ic>, "backend/.env 설정을 점검합니다", "점검"],
          [<Ic key="logs">logs</Ic>, "setup 로그를 보여 줍니다", "점검"],
          [<Ic key="db">db</Ic>, "마이그레이션, 관리자 계정, DB 초기화", "데이터베이스"],
          [<Ic key="add">add feature</Ic>, "새 기능 뼈대를 만듭니다", "개발"],
          [<Ic key="test">test</Ic>, "백엔드와 프론트엔드 확인을 한 번에 돌립니다", "개발"],
          [<Ic key="update">update</Ic>, "새 킷 버전의 변경을 내 프로젝트로 가져옵니다", "개발"],
        ]}
      />

      <H2>공통으로 알아 둘 것</H2>
      <UL>
        <li>
          <strong>프로젝트 폴더 안에서 실행합니다.</strong> 다른 폴더의 프로젝트를 다룰 때는 <Ic>--dir &lt;폴더&gt;</Ic>를 붙입니다(<Ic>setup</Ic>, <Ic>start</Ic>,{" "}
          <Ic>stop</Ic>, <Ic>status</Ic>, <Ic>db</Ic>, <Ic>update</Ic>에서 쓸 수 있습니다).
        </li>
        <li>
          <strong>다시 실행해도 안전합니다.</strong> <Ic>setup</Ic>은 끝난 단계를 건너뜁니다.
        </li>
        <li>
          <strong>비밀 값은 출력하지 않습니다.</strong> 로그와 점검 결과에 비밀번호나 키를 남기지 않습니다.
        </li>
        <li>
          <strong>필요한 도구:</strong> Node.js 20 이상, uv, 실행 중인 Docker Desktop, 디스크 여유 공간 2GB 이상. <Ic>{`${CMD} check`}</Ic>로 한 번에 확인할 수 있습니다.
        </li>
        <li>
          <strong>Windows:</strong> <Ic>stop</Ic>은 아직 지원하지 않습니다. 서버를 띄운 터미널에서 <Ic>Ctrl+C</Ic>를 누르세요.
        </li>
      </UL>

      <H2>Next steps</H2>
      <LinkCards
        items={[
          { href: "/docs/cli-setup", title: "시작하기: init, setup", desc: "프로젝트를 만들고 처음 세팅합니다." },
          { href: "/docs/cli-server", title: "서버: start, stop, open", desc: "서버를 켜고 끄고 엽니다." },
          { href: "/docs/cli-diagnose", title: "점검: status, check, env, logs", desc: "안 될 때 상태를 확인합니다." },
        ]}
      />
    </>
  );
}

export function CliSetup() {
  return (
    <>
      <H2>init</H2>
      <P>
        템플릿(frontend, backend, <Ic>docker-compose.yml</Ic>)을 새 폴더에 펼칩니다. 설치나 실행은 하지 않습니다.
      </P>
      <CodeBlock title="bash" code={`npx create-meerkit my-app\n# 또는\n${CMD} init my-app`} />
      <UL>
        <li>폴더 이름은 소문자, 숫자, <Ic>-</Ic>, <Ic>_</Ic>만 쓸 수 있고 문자나 숫자로 시작해야 합니다.</li>
        <li>이미 있는 폴더라면 비어 있어야 합니다.</li>
      </UL>

      <H2>setup</H2>
      <P>프로젝트 폴더 안에서 실행합니다. 세팅 6단계를 순서대로 진행하고, 끝나면 서버까지 켭니다.</P>
      <CodeBlock title="bash" code={`cd my-app\n${CMD} setup`} />
      <DocTable
        head={["단계", "하는 일"]}
        rows={[
          ["점검", "Node, npm, uv, Docker, 디스크 여유 공간, 사용할 포트를 확인합니다"],
          ["1/6", "프론트엔드 라이브러리 설치 (npm install)"],
          ["2/6", "백엔드 라이브러리 설치 (uv sync)"],
          ["3/6", "backend/.env, frontend/.env.local을 만들고 비밀키를 채웁니다. 이미 있으면 덮어쓰지 않습니다"],
          ["4/6", "데이터베이스를 켭니다 (docker compose)"],
          ["5/6", "데이터베이스 테이블을 만듭니다 (마이그레이션)"],
          ["6/6", "로컬용 관리자 계정을 만듭니다"],
        ]}
      />
      <Options
        rows={[
          ["--port <번호>", "프론트엔드 포트 (기본 3000)"],
          ["--api-port <번호>", "백엔드 포트 (기본 8000)"],
          ["--db-port <번호>", "DB 컨테이너가 여는 포트 (기본 5432). backend/.env의 DATABASE_URL·TEST_DATABASE_URL 포트도 함께 바뀝니다"],
          ["--no-start", "서버는 켜지 않고 세팅만 합니다"],
          ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"],
        ]}
      />
      <H3>예시</H3>
      <CodeBlock title="bash" code={`# 서버는 켜지 않고 세팅만\n${CMD} setup --no-start\n\n# 3000, 8000 포트를 다른 프로그램이 쓰고 있을 때\n${CMD} setup --port 3100 --api-port 8100\n\n# 5432 포트를 다른 프로그램이 쓰고 있을 때 (DB 포트 바꾸기)\n${CMD} setup --db-port 5433`} />
      <UL>
        <li>포트는 1024~65535 사이이고 두 포트가 같으면 안 됩니다. 브라우저가 막는 포트(예: 6000)는 피하세요.</li>
        <li><Ic>--port</Ic>, <Ic>--api-port</Ic>는 <Ic>.env</Ic> 파일을 고치지 않고, 서로를 가리키는 주소(CORS, API 프록시)가 이번 실행에 맞춰 함께 바뀝니다.</li>
        <li><Ic>--db-port</Ic>는 <Ic>backend/.env</Ic>의 <Ic>DATABASE_URL</Ic>, <Ic>TEST_DATABASE_URL</Ic> 포트를 고칩니다(로컬 DB 주소만). 한 번 정하면 다음부터는 옵션 없이 <Ic>setup</Ic>, <Ic>start</Ic>가 그 포트를 씁니다. 직접 켤 때는 <Ic>DB_PORT=5433 docker compose up -d db</Ic>입니다.</li>
        <li>전체 로그는 프로젝트 폴더의 <Ic>meerkit-setup.log</Ic>에 남습니다. 비밀 값은 기록하지 않습니다.</li>
      </UL>
      <Callout tone="warn">
        관리자 계정은 로컬 개발용입니다. 아이디와 비밀번호는 <Ic>backend/.env</Ic>의 <Ic>SEED_ADMIN_USER_ID</Ic>, <Ic>SEED_ADMIN_PASSWORD</Ic>에 있고, 운영에서는 반드시 바꾸세요.
        기본 포트가 아니면 Google 같은 소셜 로그인은 등록한 주소와 달라 동작하지 않을 수 있습니다.
      </Callout>

      <H2>자주 나는 문제</H2>
      <DocTable
        head={["증상", "확인할 것"]}
        rows={[
          ["Docker Desktop이 켜져 있는데 \"응답이 없음\"", "디스크가 가득 차면 Docker가 멈춥니다. 공간을 확보하고 Docker Desktop을 재시작하세요."],
          ["Docker Desktop \"실행 중이 아님\"", "Docker Desktop을 실행하고 완전히 켜질 때까지 기다린 뒤 다시 실행하세요."],
          ["\"이미 사용 중\" 포트 오류", "안내에 나온 프로그램을 종료하거나 --port, --api-port, --db-port(DB 5432)로 다른 포트를 쓰세요."],
          ["한 단계에서 멈춤", "화면에 나온 원인과 해결 방법을 따른 뒤 같은 setup 명령을 다시 실행하면 그 단계부터 이어집니다."],
          ["npm install 중 ENOSPC", "디스크 공간 부족입니다. 공간을 확보한 뒤 다시 실행하세요."],
        ]}
      />
    </>
  );
}

export function CliServer() {
  return (
    <>
      <H2>start</H2>
      <P>
        세팅이 끝난 프로젝트의 서버만 켭니다. DB 확인, 백엔드, 프론트엔드 순서로 켜며 설치와 마이그레이션은 하지 않습니다. <Ic>Ctrl+C</Ic>로 끄면 자식 프로세스까지 정리합니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} start\n${CMD} start --port 3100 --api-port 8100`} />
      <Options
        rows={[
          ["--port <번호>", "프론트엔드 포트 (기본 3000)"],
          ["--api-port <번호>", "백엔드 포트 (기본 8000)"],
          ["--db-port <번호>", "DB 컨테이너가 여는 포트 (기본 5432). backend/.env의 DATABASE_URL·TEST_DATABASE_URL 포트도 함께 바뀝니다"],
          ["--no-db", "DB 컨테이너는 건드리지 않습니다"],
          ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"],
        ]}
      />
      <P>
        주소는 프론트엔드 <Ic>http://localhost:3000</Ic>, API 문서(Swagger) <Ic>http://localhost:8000/docs</Ic>입니다. 포트를 바꿨다면 그 번호를 씁니다.
      </P>

      <H2>stop</H2>
      <P>이 프로젝트의 서버를 끕니다. 다른 프로그램이 쓰는 포트는 건드리지 않고 알려 줍니다. macOS와 Linux에서 동작합니다.</P>
      <CodeBlock title="bash" code={`${CMD} stop\n${CMD} stop --db   # DB 컨테이너도 멈춤 (데이터는 유지)`} />
      <Options
        rows={[
          ["--db", "DB 컨테이너도 멈춥니다 (데이터는 유지)"],
          ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"],
        ]}
      />
      <Callout>
        <Ic>start</Ic>나 <Ic>setup</Ic>에서 <Ic>--port</Ic>를 바꿔 켠 서버도 <Ic>stop</Ic>이 기록된 포트를 보고 끕니다.
      </Callout>

      <H2>open</H2>
      <P>브라우저로 화면이나 API 문서를 엽니다. 주소만 열어 주므로 서버는 먼저 켜 두어야 합니다. <Ic>start</Ic>로 포트를 바꿔 켠 서버가 있으면 그 포트를 엽니다.</P>
      <CodeBlock title="bash" code={`${CMD} open        # 프론트엔드\n${CMD} open api    # Swagger API 문서`} />
      <DocTable
        head={["대상", "열리는 주소"]}
        rows={[
          [<Ic key="w">web</Ic>, "프론트엔드 (기본값)"],
          [<Ic key="a">api</Ic>, "백엔드 API 문서 (/docs)"],
        ]}
      />
    </>
  );
}

export function CliDiagnose() {
  return (
    <>
      <Callout>안 될 때는 먼저 <Ic>status</Ic>를 실행하세요. 어디가 문제인지 한눈에 보입니다.</Callout>

      <H2>status</H2>
      <P>세팅 여부, DB 컨테이너, 마이그레이션이 최신인지, 서버 포트의 소유자와 응답을 보여 줍니다.</P>
      <CodeBlock title="bash" code={`${CMD} status`} />
      <CodeBlock
        title="출력 예"
        code={`✔ 세팅: 끝남 (.env, 백엔드·프론트엔드 라이브러리)\n✔ DB: 실행 중 (healthy)\n✔ 마이그레이션: 최신\n✔ 백엔드 (8000): 켜져 있음 → 응답 200\n✔ 프론트엔드 (3000): 켜져 있음 → 응답 200`}
      />
      <Options rows={[["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"]]} />

      <H2>check</H2>
      <P>
        개발 도구를 점검하고, 없으면 설치 링크를 보여 줍니다. Node.js 20 이상, npm, uv, Docker, Docker Compose, Docker Desktop 실행 여부와 디스크 여유 공간(2GB 이상)을 확인합니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} check`} />
      <UL>
        <li>Docker Desktop이 켜져 있어도 멈췄다면 &ldquo;응답이 없음&rdquo;으로 구분해 알려 줍니다. 디스크 공간을 확보하고 Docker Desktop을 재시작하세요.</li>
      </UL>

      <H2>env check</H2>
      <P>
        <Ic>backend/.env</Ic>에서 예시 값 그대로인 비밀키, 로컬 전용 설정 등을 찾습니다. 값은 출력하지 않습니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} env check\n${CMD} env check --prod   # 배포 전 확인`} />
      <Options rows={[["--prod", "운영 배포 기준으로 점검합니다. 위험한 값은 오류로 보고, 문제가 있으면 종료 코드 1을 돌려줍니다"]]} />

      <H2>logs</H2>
      <P>프로젝트 루트의 <Ic>meerkit-setup.log</Ic> 마지막 부분을 보여 줍니다. 세팅이 중간에 실패했을 때 원인을 찾는 데 씁니다.</P>
      <CodeBlock title="bash" code={`${CMD} logs\n${CMD} logs -n 100\n${CMD} logs --path`} />
      <Options
        rows={[
          ["-n <줄수>", "보여 줄 줄 수 (기본 50)"],
          ["--path", "로그 파일 경로만 출력합니다"],
        ]}
      />
    </>
  );
}

export function CliDatabase() {
  return (
    <>
      <H2>db</H2>
      <P>
        <Ic>db</Ic> 아래에 세 가지 동작이 있습니다. 프로젝트 폴더 안에서 실행하고, DB 컨테이너가 켜져 있어야 합니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} db <migrate|seed|reset> [--yes] [--dir <폴더>]`} />
      <DocTable
        head={["동작", "하는 일"]}
        rows={[
          [<Ic key="m">migrate</Ic>, "alembic upgrade head. 테이블을 최신 상태로 만듭니다"],
          [<Ic key="s">seed</Ic>, "로컬용 관리자 계정을 만듭니다"],
          [<Ic key="r">reset</Ic>, "로컬 DB를 지우고 처음부터 다시 만듭니다 (마이그레이션과 관리자 계정까지)"],
        ]}
      />

      <H2>reset</H2>
      <Callout tone="warn">로컬 DB의 데이터가 모두 지워집니다. 되돌릴 수 없습니다.</Callout>
      <OL>
        <li>실수를 막기 위해 프로젝트 폴더 이름을 입력해야 합니다.</li>
        <li>이 프로젝트의 docker-compose DB(<Ic>localhost</Ic>, <Ic>starter</Ic> 계정)가 아닌 DB(원격 DB, Supabase 로컬)에서는 실행하지 않고 멈춥니다. DB 포트는 바꿨어도 됩니다.</li>
        <li>지운 뒤 DB를 다시 켜고 마이그레이션과 관리자 계정 생성까지 진행합니다.</li>
      </OL>
      <CodeBlock title="bash" code={`${CMD} db reset\n${CMD} db reset --yes   # 확인 입력 생략 (자동화용)`} />
      <Options
        rows={[
          ["--yes", "reset의 확인 입력을 건너뜁니다"],
          ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"],
        ]}
      />
    </>
  );
}

export function CliDevelop() {
  return (
    <>
      <H2>add feature</H2>
      <P>
        새 기능 뼈대를 만듭니다. 백엔드 <Ic>features/&lt;이름&gt;</Ic>(router, service, repository, schemas)와 테스트, 프론트 <Ic>(service)/&lt;이름&gt;</Ic> 화면 골격을 만들고{" "}
        <Ic>api.py</Ic>에 라우터를 등록합니다.
      </P>
      <CodeBlock title="bash" code={`${CMD} add feature meetings\n${CMD} add feature meetings --dry-run   # 만들 파일 목록만 보기`} />
      <UL>
        <li>이름은 소문자로 시작하는 영문, 숫자, <Ic>_</Ic>입니다.</li>
        <li><Ic>--dry-run</Ic>은 파일을 만들지 않고 목록만 보여 줍니다.</li>
      </UL>

      <H2>test</H2>
      <P>백엔드 <Ic>ruff</Ic>와 <Ic>pytest</Ic>, 프론트엔드 <Ic>lint</Ic>와 <Ic>build</Ic>를 차례로 돌립니다. pytest는 DB가 켜져 있어야 합니다.</P>
      <CodeBlock title="bash" code={`${CMD} test\n${CMD} test --backend\n${CMD} test --frontend --fast`} />
      <Options
        rows={[
          ["--backend", "백엔드만 확인합니다"],
          ["--frontend", "프론트엔드만 확인합니다"],
          ["--fast", "build를 생략합니다"],
        ]}
      />
      <UL>
        <li>
          원인을 알 수 있는 실패(DB 연결 실패, 테이블 없음, <Ic>.env</Ic> 값 누락, 파이썬 모듈 없음, 포트 사용 중)는 스택 트레이스 대신 <strong>원인, 실제 에러 줄, 해결 순서</strong>를 보여 줍니다.
          알 수 없는 실패는 마지막 로그를 그대로 보여 줍니다. 전체 로그는 <Ic>meerkit-test.log</Ic>에 남습니다.
        </li>
        <li>
          <Ic>pytest</Ic>는 DB가 필요합니다. DB가 응답하지 않으면 pytest를 돌리지 않고 바로 어느 주소·포트에 연결하지 못했는지와 해결 방법을 알려 줍니다. 이럴 때는 <Ic>{`${CMD} status`}</Ic>로 확인한 뒤 <Ic>{`${CMD} start`}</Ic>로 DB를 켜세요.
        </li>
      </UL>

      <H2>update</H2>
      <P>
        킷은 파일을 복사해 주는 템플릿이라서, 새 버전이 나와도 만든 프로젝트는 그대로입니다. <Ic>update</Ic>는 처음 받은 파일(<Ic>.meerkit/manifest.json</Ic>)과 지금 파일, 새 버전을 비교해 가져올 변경을 알려 줍니다.
      </P>
      <CodeBlock title="bash" code={`${CMD}@latest update            # 무엇이 바뀌는지 미리 보기\n${CMD}@latest update --apply    # 실제로 적용`} />
      <DocTable
        head={["내 파일 상태", "update가 하는 일"]}
        rows={[
          ["내가 고치지 않은 파일", "새 버전으로 갱신합니다"],
          ["내가 고쳤고 킷도 바뀐 파일", "덮어쓰지 않고 파일명.meerkit-new로 새 버전을 옆에 둡니다. 직접 합치세요"],
          ["내가 고쳤고 킷은 그대로인 파일, 내가 지운 파일", "그대로 둡니다"],
          ["새로 생긴 파일", "추가합니다"],
          ["package-lock.json, uv.lock", "비교하지 않습니다. package.json이나 pyproject.toml이 바뀌면 setup으로 다시 설치하세요"],
        ]}
      />
      <Options
        rows={[
          ["--apply", "실제로 파일을 씁니다 (없으면 미리보기만)"],
          ["--force", "커밋하지 않은 변경이 있어도 적용합니다"],
          ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"],
        ]}
      />
      <Callout tone="warn">
        <Ic>--apply</Ic> 전에 변경을 커밋해 두세요. 커밋하지 않은 변경이 있으면 적용이 막힙니다. 0.1.0-rc.2 이전 버전으로 만든 프로젝트는 처음 받은 파일의 기록이 없어 대부분이 충돌로 나옵니다.
      </Callout>
    </>
  );
}
