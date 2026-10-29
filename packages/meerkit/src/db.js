import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createInterface } from "node:readline/promises";

import { activePorts } from "./ports.js";
import { listenersOf } from "./proc.js";
import { findProjectRoot } from "./setup.js";
import { missingSetup } from "./start.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

const isWin = process.platform === "win32";

const inherit = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin }).status ?? 1;

/** backend/.env 의 DATABASE_URL에서 호스트·포트를 읽는다. 비밀번호는 읽어도 다루지 않는다. */
export async function databaseTarget(root) {
  try {
    const text = await readFile(join(root, "backend", ".env"), "utf8");
    const m = text.match(/^DATABASE_URL=(.+)$/m);
    if (!m) return null;
    const u = new URL(m[1].trim().replace(/^postgresql\+psycopg:/, "postgresql:"));
    return { host: u.hostname, port: Number(u.port || 5432), local: ["localhost", "127.0.0.1", "::1"].includes(u.hostname) };
  } catch {
    return null;
  }
}

async function confirm(question, expected) {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim() === expected;
  } finally {
    rl.close();
  }
}

const migrate = (root) => inherit("uv", ["run", "alembic", "upgrade", "head"], join(root, "backend"));
const seed = (root) => inherit("uv", ["run", "python", "-m", "app.users.seed"], join(root, "backend"));

export async function runDb(args) {
  const [sub, ...rest] = args;
  const dirIdx = rest.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? rest[dirIdx + 1] : process.cwd());
  if (!["migrate", "seed", "reset"].includes(sub)) {
    info(`사용법: ${cyan("npx @snackcup/meerkit db <migrate|seed|reset>")}   (자세히: db --help)`);
    return sub ? 1 : 0;
  }
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  const missing = missingSetup(root);
  if (missing.length) {
    fail(`아직 세팅이 끝나지 않았습니다. 없는 것: ${missing.join(", ")}`);
    info(`  먼저 ${cyan("npx @snackcup/meerkit setup")} 을 실행하세요.`);
    return 1;
  }

  if (sub === "migrate") {
    info(bold("마이그레이션을 적용합니다 (alembic upgrade head)."));
    const code = migrate(root);
    if (code === 0) ok("마이그레이션 완료");
    else fail("마이그레이션에 실패했습니다. DB가 켜져 있는지 확인하세요 (npx @snackcup/meerkit status).");
    return code;
  }
  if (sub === "seed") {
    info(bold("로컬용 관리자 계정을 만듭니다."));
    const code = seed(root);
    if (code === 0) ok("완료 (아이디와 비밀번호는 backend/.env 의 SEED_ADMIN_* 에 있습니다)");
    else fail("실패했습니다. 마이그레이션이 끝났는지 확인하세요 (npx @snackcup/meerkit db migrate).");
    return code;
  }

  // reset: 로컬 docker-compose DB를 지우고 처음부터 다시 만든다
  const target = await databaseTarget(root);
  if (!target?.local || target.port !== 5432) {
    fail("reset은 이 프로젝트의 docker-compose DB(localhost:5432)에서만 실행합니다.");
    info(`  backend/.env 의 DATABASE_URL 이 ${target ? `${target.host}:${target.port}` : "없거나 읽을 수 없음"} 입니다. 다른 DB를 지우는 사고를 막기 위해 멈춥니다.`);
    return 1;
  }
  const apiPort = (await activePorts(root)).api;
  if (listenersOf(apiPort).length) {
    fail(`백엔드(${apiPort})가 켜져 있습니다. 먼저 서버를 끄세요: npx @snackcup/meerkit stop`);
    return 1;
  }
  const name = basename(root);
  warn(`${bold("이 프로젝트의 로컬 DB 데이터가 모두 지워집니다")} (회원, 약관 동의 기록 등). 되돌릴 수 없습니다.`);
  if (!rest.includes("--yes")) {
    const okInput = await confirm(`계속하려면 프로젝트 폴더 이름(${cyan(name)})을 입력하세요: `, name);
    if (!okInput) {
      info("취소했습니다. (자동 실행은 --yes 를 붙이세요)");
      return 1;
    }
  }
  info(dim("\n1/4 DB 컨테이너와 볼륨 삭제 (docker compose down -v)"));
  if (inherit("docker", ["compose", "down", "-v"], root) !== 0) return 1;
  info(dim("2/4 DB 새로 켜기"));
  if (inherit("docker", ["compose", "up", "-d", "--wait", "db"], root) !== 0) return 1;
  info(dim("3/4 마이그레이션"));
  if (migrate(root) !== 0) return 1;
  info(dim("4/4 관리자 계정"));
  if (seed(root) !== 0) return 1;
  ok(bold("DB를 처음 상태로 되돌렸습니다."));
  return 0;
}
