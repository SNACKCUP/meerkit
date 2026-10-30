// 저장소의 킷 파일을 packages/meerkit/template/ 으로 복사하고, 팀 내부 자료를 걷어 낸다.
// 배포(npm pack/publish) 직전에 자동으로 실행된다 (prepack).
import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const out = resolve(here, "..", "template");

// 템플릿에 넣을 것 (git이 추적하는 파일만 복사하므로 .env, node_modules, 빌드 결과는 자동으로 빠진다)
const INCLUDE = ["frontend", "backend", "docker-compose.yml", ".github/workflows", ".gitignore"];

// 템플릿에서 뺄 것: 예시 기능의 테스트
const EXCLUDE_PREFIXES = ["backend/tests/features/"];

// 복사 뒤에 하나도 남아 있으면 안 되는 문자열 (서비스 코드·설명서 흔적)
const FORBIDDEN = ["maemusae", "malmoa", "requirements_router", "features.requirements", "gsap", "markitdown", "DocsView", "DocsSearch", "DocsShell", "meerkit/docs", "showDocsPage"];

function git(args) {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} 실패: ${r.stderr}`);
  return r.stdout;
}

async function readJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}
const writeJson = (p, v) => writeFile(p, JSON.stringify(v, null, 2) + "\n");

async function renameGitignores(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await renameGitignores(full);
    else if (e.name === ".gitignore") await rename(full, join(dir, "_gitignore"));
  }
}

async function walk(dir, base = dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, base, acc);
    else acc.push(relative(base, full).split("\\").join("/"));
  }
  return acc;
}

const README = `# MeerKit 프로젝트

미어캣(meerkat) + 키트(kit). 무리를 위해 망을 봐 주는 미어캣처럼, 인증과 권한 같은 공통 기반이 서비스를 받쳐 주는 AI 서비스 스타터킷입니다.

## 시작하기

\`\`\`bash
npx @snackcup/meerkit setup
\`\`\`

환경 점검(Node.js, uv, Docker Desktop) → 라이브러리 설치 → 환경 변수와 비밀키 생성 → DB 실행 → 마이그레이션 → 로컬용 관리자 계정 → 서버 시작까지 자동으로 진행합니다.
- 이미 끝난 단계는 건너뛰므로 다시 실행해도 안전합니다.
- 전체 로그는 \`meerkit-setup.log\`에 남습니다.
- 서버를 켜지 않고 세팅만 하려면 \`npx @snackcup/meerkit setup --no-start\`
- 세팅이 끝난 뒤 서버만 켜려면 \`npx @snackcup/meerkit start\` (DB, 백엔드 8000, 프론트엔드 3000), 끄려면 \`stop\`, 상태는 \`status\`
- 새 기능 뼈대: \`npx @snackcup/meerkit add feature <이름>\`, 전체 명령: \`npx @snackcup/meerkit --help\`

| 서비스 | 주소 |
| --- | --- |
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API 문서 | http://localhost:8000/docs |

로컬용 관리자 계정은 \`backend/.env\`의 \`SEED_ADMIN_EMAIL\`, \`SEED_ADMIN_PASSWORD\`입니다. **로컬 전용**이니 운영에서는 반드시 바꾸세요.

## 폴더 구조

\`\`\`text
frontend/             Next.js + shadcn/ui (킷 코드는 src/meerkit, 설정은 meerkit.config.ts)
backend/              FastAPI + SQLAlchemy + Alembic + PostgreSQL
docker-compose.yml    로컬 DB (PostgreSQL)
\`\`\`

## 직접 실행하고 싶다면

\`\`\`bash
docker compose up -d db
cd backend && uv sync && uv run alembic upgrade head && uv run python -m app.users.seed
uv run uvicorn app.main:app --reload
# 다른 터미널
cd frontend && npm install && npm run dev
\`\`\`

## 알아 두세요

- 사용 설명서는 별도 사이트로 배포됩니다. 이 프로젝트에는 설명서 화면이 들어 있지 않고, 웰컴 페이지만 있습니다. 설명서 사이트 주소를 \`frontend/.env.example\`의 \`NEXT_PUBLIC_DOCS_URL\`에 넣으면 웰컴 페이지에 Docs 버튼이 나타납니다.
- 백엔드는 개발 중입니다. 일부 API는 바뀔 수 있습니다.
`;

// 설명서(/docs) 화면 코드를 템플릿의 프론트에서 걷어 낸다.
async function stripDocs(front) {
  const src = join(front, "src");
  const mockFile = join(src, "meerkit", "docs", "content", "mock.ts");

  // 웰컴 페이지의 떠 있는 카드가 설명서의 목 데이터(mockUsers)를 쓰므로, 필요한 부분만 웰컴 폴더로 옮긴다.
  const mock = await readFile(mockFile, "utf8");
  const m = mock.match(/export const roleOf[\s\S]*?\nconst at[^\n]*\n[\s\S]*?export const mockUsers: User\[\] = \[[\s\S]*?\n\];/);
  if (!m) throw new Error("mock.ts에서 mockUsers를 찾지 못했습니다 (설명서 제거 스크립트를 고쳐야 합니다).");
  await writeFile(
    join(src, "meerkit", "welcome", "mock-users.ts"),
    `import { ROLES, type RoleName } from "../roles";\nimport type { User } from "../types";\n\n// 웰컴 페이지 미리보기 카드용 목 데이터\n${m[0]}\n`,
  );
  const ghost = join(src, "meerkit", "welcome", "GhostCards.tsx");
  await writeFile(ghost, (await readFile(ghost, "utf8")).replace('"../docs/content/mock"', '"./mock-users"'));

  await rm(join(src, "meerkit", "docs"), { recursive: true, force: true });
  await rm(join(src, "app", "(meerkit)", "docs"), { recursive: true, force: true });

  // sitemap: 설명서 주소 없이 앱 화면만 (docsOnly일 때는 비운다)
  await writeFile(
    join(src, "app", "sitemap.ts"),
    `import type { MetadataRoute } from "next";

import { meerkitConfig } from "@/meerkit";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = meerkitConfig.docsOnly ? [] : ["/", "/terms", "/privacy"];
  return pages.map((path) => ({ url: \`\${SITE_URL}\${path === "/" ? "" : path}\` }));
}
`,
  );

  // API 명세 생성 스크립트는 설명서용이라 뺀다
  await rm(join(front, "scripts", "gen-api-spec.mjs"), { force: true });
  const fpkgPath = join(front, "package.json");
  const fpkg = await readJson(fpkgPath);
  for (const k of Object.keys(fpkg.scripts ?? {})) if (/gen-api-spec/.test(fpkg.scripts[k])) delete fpkg.scripts[k];
  await writeJson(fpkgPath, fpkg);

  // 공개 API에서 설명서 내보내기 제거
  const index = join(src, "meerkit", "index.ts");
  await writeFile(index, (await readFile(index, "utf8")).split("\n").filter((l) => !l.includes('"./docs/')).join("\n"));

  // 설정: Docs 주소 기본값은 비우고, /docs 라우트 스위치는 없앤다
  const cfg = join(src, "meerkit", "config.ts");
  let c = await readFile(cfg, "utf8");
  c = c
    .replace(/  \/\/ 웰컴 페이지 Docs 버튼이 여는 주소[^\n]*\n  docsUrl: [^\n]*\n/, "  // 웰컴 페이지 Docs 버튼이 여는 주소 (사용 설명서 사이트). 비워 두면 버튼을 보여 주지 않는다.\n  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? \"\",\n")
    .replace(/  \/\/ 이 앱에서 \/docs 라우트를[^\n]*\n  showDocsPage: [^\n]*\n/, "");
  await writeFile(cfg, c);

  // 웰컴 페이지: Docs 주소가 있을 때만 버튼을 보여 준다 (docsButton이 null이면 아무것도 그려지지 않는다)
  const welcome = join(src, "meerkit", "welcome", "WelcomePage.tsx");
  let w = await readFile(welcome, "utf8");
  const def = /const docsButton = \(\n([\s\S]*?)\n  \);\n/;
  if (!def.test(w)) throw new Error("WelcomePage에서 docsButton을 찾지 못했습니다 (설명서 제거 스크립트를 고쳐야 합니다).");
  w = w.replace(def, (all, body) => `const docsButton = meerkitConfig.docsUrl ? (\n${body}\n  ) : null;\n`);
  await writeFile(welcome, w);

  // 환경 변수 예시
  const env = join(front, ".env.example");
  let e = await readFile(env, "utf8");
  e = e
    .replace(/# 웰컴 페이지 Docs 링크 주소[^\n]*\nNEXT_PUBLIC_DOCS_URL=\n/, "# 웰컴 페이지의 Docs 버튼이 여는 주소 (사용 설명서 사이트). 비우면 버튼이 보이지 않습니다\nNEXT_PUBLIC_DOCS_URL=\n")
    .replace(/# 이 앱에서 \/docs 라우트를[^\n]*\nNEXT_PUBLIC_SHOW_DOCS_PAGE=[^\n]*\n?/, "");
  await writeFile(env, e);
}

async function main() {
  if (!existsSync(join(repo, ".git"))) throw new Error("저장소 루트를 찾지 못했습니다 (packages/meerkit 안에서 실행하세요).");
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  // 1) git이 추적하는 파일만 복사
  const files = git(["ls-files", "-z", "--", ...INCLUDE]).split("\0").filter(Boolean);
  let copied = 0;
  for (const f of files) {
    if (EXCLUDE_PREFIXES.some((p) => f.startsWith(p))) continue;
    const src = join(repo, f);
    if (!existsSync(src)) continue; // 지워졌지만 아직 커밋되지 않은 파일
    await mkdir(dirname(join(out, f)), { recursive: true });
    await cp(src, join(out, f));
    copied++;
  }

  // 2) 설명서 정리
  // 프론트: 사용 설명서는 별도 사이트로 배포하므로 앱에서는 설명서 코드를 모두 뺀다 (웰컴 페이지만 남는다)
  await stripDocs(join(out, "frontend"));

  // 백엔드 환경 변수 예시: 생성된 프로젝트에는 Supabase 대체용 줄을 빼고 docker-compose의 PostgreSQL 주소만 남긴다.
  const envExample = join(out, "backend", ".env.example");
  if (existsSync(envExample)) {
    const docker = "postgresql+psycopg://starter:starter@localhost:5432";
    let env = await readFile(envExample, "utf8");
    env = env
      .replace(/^# DATABASE_URL=.*Supabase.*\n/m, "")
      .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${docker}/starter  # docker-compose.yml의 db (로컬 전용 계정)`)
      .replace(/^TEST_DATABASE_URL=.*$/m, `TEST_DATABASE_URL=${docker}/meerkit_test`);
    await writeFile(envExample, env);
  }

  // 3) 루트 README, .gitignore (setup 로그 제외 추가)
  await writeFile(join(out, "README.md"), README);
  const gi = join(out, ".gitignore");
  if (existsSync(gi)) await writeFile(gi, (await readFile(gi, "utf8")).trimEnd() + "\n\n# meerkit\nmeerkit-setup.log\nmeerkit-test.log\n");
  await renameGitignores(out); // npm 패키지에서 .gitignore가 빠지지 않게 _gitignore로

  // 4) 확인: 비밀 값/서비스 코드/팀 자료가 없는지
  const all = await walk(out);
  const problems = [];
  for (const f of all) {
    if (/(^|\/)\.env($|\.local)/.test(f) || /node_modules|\.next\/|\.venv|__pycache__/.test(f)) problems.push(`들어가면 안 되는 파일: ${f}`);
    if (/^(docs|\.claude)\//.test(f) || f === "CLAUDE.md") problems.push(`팀 자료: ${f}`);
  }
  for (const f of all) {
    if (!/\.(ts|tsx|py|json|md|toml|yml|yaml|mjs|css|example)$/.test(f) && !f.endsWith("_gitignore")) continue;
    const text = await readFile(join(out, f), "utf8").catch(() => "");
    for (const w of FORBIDDEN) if (text.toLowerCase().includes(w.toLowerCase())) problems.push(`금지 문자열 "${w}": ${f}`);
  }
  if (problems.length) {
    console.error("템플릿 점검 실패:\n  " + problems.join("\n  "));
    process.exitCode = 1;
    return;
  }
  const size = (await Promise.all(all.map(async (f) => (await stat(join(out, f))).size))).reduce((a, b) => a + b, 0);
  console.log(`템플릿 준비 완료: 파일 ${all.length}개, ${(size / 1024 / 1024).toFixed(1)}MB (git 추적 ${copied}개 복사)`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
