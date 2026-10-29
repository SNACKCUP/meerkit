import { bold, cyan, dim } from "./ui.js";

const CMD = "npx @snackcup/meerkit";

/**
 * 명령 목록. 도움말은 여기서 만들어지므로, 명령을 추가하면 여기에도 적는다.
 * group: 목록에서 묶는 이름, usage: 사용 형태, options: [옵션, 설명], examples: [명령, 설명]
 */
export const COMMANDS = [
  { name: "init", group: "시작하기", summary: "새 프로젝트를 만듭니다", usage: "init <폴더이름>", details: "템플릿(frontend, backend, docker-compose.yml)을 펼칩니다. 폴더 이름은 소문자·숫자·-·_ 만 쓸 수 있습니다. npx create-meerkit <폴더이름> 과 같습니다.", options: [], examples: [["npx create-meerkit my-app", "새 프로젝트 만들기"]] },
  { name: "setup", group: "시작하기", summary: "환경 점검 → 설치 → DB → 관리자 계정 → 서버 시작", usage: "setup [--no-start] [--dir <폴더>]", details: "프로젝트 폴더 안에서 실행합니다. 끝난 단계는 건너뛰므로 다시 실행해도 안전합니다. 전체 로그는 meerkit-setup.log 에 남습니다(비밀 값은 기록하지 않음).", options: [["--no-start", "서버는 켜지 않고 세팅만 합니다"], ["--dir <폴더>", "다른 폴더의 프로젝트를 대상으로 합니다"]], examples: [[`${CMD} setup`, "처음 한 번"]] },
  { name: "start", group: "서버", summary: "세팅이 끝난 프로젝트의 서버만 켭니다", usage: "start [--port <번호>] [--api-port <번호>] [--no-db] [--dir <폴더>]", details: "DB 확인 → 백엔드(8000) → 프론트엔드(3000) 순서로 켭니다. 설치·마이그레이션은 하지 않습니다. Ctrl+C 로 끄면 자식 프로세스까지 정리합니다.", options: [["--port <번호>", "프론트엔드 포트 (기본 3000)"], ["--api-port <번호>", "백엔드 포트 (기본 8000)"], ["--no-db", "DB 컨테이너는 건드리지 않습니다"]], examples: [[`${CMD} start`, "서버 켜기"], [`${CMD} start --port 3100 --api-port 8100`, "3000·8000이 쓰이는 중일 때"]] },
  { name: "stop", group: "서버", summary: "이 프로젝트의 서버를 끕니다", usage: "stop [--db] [--dir <폴더>]", details: "3000·8000 포트에서 실행 중인 이 프로젝트의 서버만 끕니다. 다른 프로그램이 쓰는 포트는 건드리지 않고 알려 줍니다. macOS/Linux 에서 동작합니다.", options: [["--db", "DB 컨테이너도 멈춥니다 (데이터는 유지)"]], examples: [[`${CMD} stop --db`, "서버와 DB 모두 끄기"]] },
  { name: "status", group: "점검", summary: "DB·서버·마이그레이션 상태를 한눈에 봅니다", usage: "status [--dir <폴더>]", details: "세팅 여부, DB 컨테이너, 마이그레이션이 최신인지, 3000·8000 포트의 소유자와 응답을 보여 줍니다. 안 될 때 가장 먼저 실행해 보세요.", options: [], examples: [[`${CMD} status`, ""]] },
  { name: "check", group: "점검", summary: "개발 도구(Node, npm, uv, Docker)를 점검합니다", usage: "check", details: "Node.js 20 이상, npm, uv, Docker, Docker Compose, Docker Desktop 실행 여부를 확인하고 없으면 설치 링크를 보여 줍니다.", options: [], examples: [] },
  { name: "env", group: "점검", summary: "backend/.env 설정을 점검합니다", usage: "env check [--prod]", details: "예시 값 그대로인 비밀키, 로컬 전용 설정 등을 찾습니다. 값은 출력하지 않습니다. --prod 는 운영 배포 기준이라 위험한 값을 오류로 봅니다.", options: [["--prod", "운영 기준으로 점검 (문제가 있으면 종료 코드 1)"]], examples: [[`${CMD} env check --prod`, "배포 전 확인"]] },
  { name: "logs", group: "점검", summary: "setup 로그를 보여 줍니다", usage: "logs [-n <줄수>] [--path]", details: "프로젝트 루트의 meerkit-setup.log 마지막 부분을 보여 줍니다.", options: [["-n <줄수>", "보여 줄 줄 수 (기본 50)"], ["--path", "로그 파일 경로만 출력"]], examples: [] },
  { name: "db", group: "데이터베이스", summary: "마이그레이션·관리자 계정·DB 초기화", usage: "db <migrate|seed|reset> [--yes] [--dir <폴더>]", details: "migrate: alembic upgrade head.\nseed: 로컬용 관리자 계정 만들기.\nreset: 로컬 docker-compose DB를 지우고 처음부터 다시 만듭니다. 데이터가 모두 지워지므로 프로젝트 폴더 이름을 입력해야 하고, localhost:5432 가 아닌 DB 에서는 실행하지 않습니다.", options: [["--yes", "reset 확인 입력을 건너뜁니다 (자동화용)"]], examples: [[`${CMD} db reset`, "DB를 깨끗하게 되돌리기"]] },
  { name: "add", group: "개발", summary: "새 기능 뼈대를 만듭니다", usage: "add feature <이름> [--dry-run]", details: "백엔드 features/<이름>(router, service, repository, schemas), 테스트, 프론트 (service)/<이름> 화면 골격을 만들고 api.py 에 라우터를 등록합니다. 이름은 소문자로 시작하는 영문·숫자·_ 입니다.", options: [["--dry-run", "만들 파일 목록만 보여 줍니다"]], examples: [[`${CMD} add feature meetings`, "meetings 기능 만들기"]] },
  { name: "test", group: "개발", summary: "백엔드·프론트엔드 확인을 한 번에 돌립니다", usage: "test [--backend|--frontend] [--fast]", details: "백엔드 ruff·pytest, 프론트엔드 lint·build 를 차례로 돌립니다. pytest 는 DB 가 켜져 있어야 합니다.", options: [["--backend", "백엔드만"], ["--frontend", "프론트엔드만"], ["--fast", "build 를 생략"]], examples: [] },
  { name: "update", group: "개발", summary: "새 킷 버전의 변경을 내 프로젝트로 가져옵니다", usage: "update [--apply] [--force] [--dir <폴더>]", details: "킷은 파일을 복사해 주는 템플릿이라서, 새 버전이 나와도 만든 프로젝트는 그대로입니다. update 는 처음 받은 파일(.meerkit/manifest.json)과 지금 파일, 새 버전을 비교합니다.\n- 내가 안 고친 파일: 새 버전으로 갱신\n- 내가 고쳤고 킷도 바뀐 파일: 덮어쓰지 않고 파일명.meerkit-new 로 새 버전을 옆에 둠 (직접 합치기)\n- 내가 고치고 킷은 그대로인 파일, 내가 지운 파일: 그대로 둠\n- 새로 생긴 파일: 추가\n기본은 미리보기이고 --apply 를 줘야 씁니다. 항상 최신 템플릿으로 하려면 @latest 로 실행하세요. rc.2 이전 버전으로 만든 프로젝트는 기록이 없어 다른 곳이 모두 충돌로 나옵니다.", options: [["--apply", "실제로 파일을 씁니다 (없으면 미리보기만)"], ["--force", "커밋하지 않은 변경이 있어도 적용합니다"]], examples: [[`${CMD}@latest update`, "무엇이 바뀌는지 미리 보기"], [`${CMD}@latest update --apply`, "적용"]] },
  { name: "open", group: "개발", summary: "브라우저로 열기", usage: "open [web|api]", details: "web: http://localhost:3000, api: http://localhost:8000/docs (Swagger)", options: [], examples: [] },
];

const pad = (s, n) => s + " ".repeat(Math.max(1, n - [...s].length));

export function helpAll() {
  const groups = [...new Set(COMMANDS.map((c) => c.group))];
  const lines = ["", `${bold("meerkit")} — Meerkit 스타터킷 CLI`, "", `사용법  ${cyan(`${CMD} <명령> [옵션]`)}   (자세히: ${cyan("<명령> --help")})`];
  for (const g of groups) {
    lines.push("", bold(g));
    for (const c of COMMANDS.filter((x) => x.group === g)) lines.push(`  ${cyan(pad(c.name, 9))}${c.summary}`);
  }
  lines.push("", bold("그 밖에"), `  ${cyan(pad("help", 9))}명령 목록 / ${cyan("help <명령>")} 으로 자세히`, `  ${cyan(pad("--version", 9))}버전`, "", dim(`처음이라면: npx create-meerkit my-app → cd my-app → ${CMD} setup`), "");
  return lines.join("\n");
}

export function helpOf(name) {
  const c = COMMANDS.find((x) => x.name === name);
  if (!c) return null;
  const lines = ["", `${bold(c.name)} — ${c.summary}`, "", `사용법  ${cyan(`${CMD} ${c.usage}`)}`, "", c.details];
  if (c.options.length) {
    lines.push("", bold("옵션"));
    for (const [o, d] of c.options) lines.push(`  ${cyan(pad(o, 16))}${d}`);
  }
  if (c.examples.length) {
    lines.push("", bold("예"));
    for (const [cmd, d] of c.examples) lines.push(`  ${cmd}${d ? dim(`   # ${d}`) : ""}`);
  }
  lines.push("");
  return lines.join("\n");
}
