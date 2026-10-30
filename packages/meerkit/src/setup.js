import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

import { checkPorts, printChecks, runToolChecks } from "./checks.js";
import { ensureEnvFiles } from "./env.js";
import { clearPidFile, writePidFile } from "./proc.js";
import { DEFAULT_PORTS, parsePorts } from "./ports.js";
import { runLogged } from "./run.js";
import { bold, cyan, dim, fail, info, ok, step, warn } from "./ui.js";

const LOG_NAME = "meerkit-setup.log";
const isWin = process.platform === "win32";

export function findProjectRoot(dir) {
  const root = resolve(dir);
  const needed = ["docker-compose.yml", join("frontend", "package.json"), join("backend", "pyproject.toml")];
  return needed.every((f) => existsSync(join(root, f))) ? root : null;
}

// 로그 마지막 줄에서 흔한 원인을 알아보고 더 구체적인 안내를 덧붙인다. 알아보지 못하면 빈 배열.
export function diagnose(lines = []) {
  const text = lines.join("\n");
  const tips = [];
  if (/EACCES|permission denied/i.test(text)) tips.push("권한 문제입니다. 폴더 소유자를 확인하고, `sudo`로 npm을 실행하지 마세요.");
  if (/ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN|network|Could not resolve host/i.test(text)) tips.push("네트워크 문제로 보입니다. 인터넷 연결과 회사/학교 프록시 설정을 확인하세요.");
  if (/port is already allocated|address already in use|bind for/i.test(text)) tips.push("이미 쓰고 있는 포트가 있습니다. 해당 포트를 쓰는 프로그램을 종료하거나 이전에 띄운 컨테이너를 `docker compose down`으로 내려 주세요.");
  if (/unknown flag: --wait/i.test(text)) tips.push("Docker Compose가 오래된 버전입니다. Docker Desktop을 최신 버전으로 업데이트하세요.");
  if (/Cannot connect to the Docker daemon|docker daemon|error during connect/i.test(text)) tips.push("Docker Desktop이 꺼져 있습니다. 실행하고 완전히 켜진 뒤 다시 시도하세요.");
  if (/password authentication failed/i.test(text)) tips.push("이전 실행의 DB 볼륨이 남아 있어 비밀번호가 맞지 않습니다. `docker compose down -v`로 지운 뒤 다시 실행하세요 (DB 데이터가 모두 지워집니다).");
  if (/Connection refused|could not connect to server/i.test(text)) tips.push("DB에 연결하지 못했습니다. `docker compose ps`로 db가 떠 있는지 확인하세요.");
  return tips;
}

export function printFailure({ title, cause, hint, logPath, retry = "setup" }) {
  console.log("");
  fail(bold(`${title} 단계에서 멈췄습니다.`));
  if (cause?.length) {
    console.log("  원인 (로그 마지막 부분):");
    for (const line of cause) console.log(`    ${dim(line.slice(0, 160))}`);
  }
  for (const tip of diagnose(cause)) console.log(`  원인으로 보이는 것: ${tip}`);
  if (hint) console.log(`  해결: ${hint}`);
  console.log(`  다시 실행: ${cyan(`npx @snackcup/meerkit ${retry}`)}${retry === "setup" ? "  (이미 끝난 단계는 건너뜁니다)" : ""}`);
  console.log(`  전체 로그: ${logPath}`);
}

/** 단계 목록. 각 단계는 다시 실행해도 안전해야 한다. */
export function buildSteps(root, logPath) {
  const run = (cmd, args, cwd, label) => runLogged(cmd, args, { cwd: join(root, cwd), logFile: logPath, label });
  return [
    {
      title: "프론트엔드 라이브러리 설치 (npm install)",
      hint: "인터넷 연결과 Node.js 버전을 확인하세요. 문제가 계속되면 frontend 폴더의 node_modules를 지우고 다시 실행하세요.",
      run: () => run("npm", ["install", "--no-audit", "--no-fund"], "frontend", "npm install"),
    },
    {
      title: "백엔드 라이브러리 설치 (uv sync)",
      hint: "인터넷 연결을 확인하세요. uv가 오래됐다면 `uv self update`를 실행해 보세요.",
      run: () => run("uv", ["sync"], "backend", "uv sync"),
    },
    {
      title: "환경 변수 파일 준비 (.env, 비밀키)",
      hint: "backend/.env.example 파일이 있는지 확인하세요.",
      run: async () => {
        try {
          const made = await ensureEnvFiles(root);
          return { code: 0, tail: [], note: made.length ? `만든 파일: ${made.join(", ")}` : "이미 준비되어 있습니다 (건너뜀)" };
        } catch (e) {
          return { code: 1, tail: [e.message] };
        }
      },
    },
    {
      title: "데이터베이스 실행 (docker compose)",
      hint: "Docker Desktop이 실행 중인지, 5432 포트를 다른 프로그램이 쓰고 있지 않은지 확인하세요.",
      run: () => run("docker", ["compose", "up", "-d", "--wait", "db"], ".", "docker compose up"),
    },
    {
      title: "데이터베이스 테이블 만들기 (마이그레이션)",
      hint: "DB가 켜져 있는지(`docker compose ps`), backend/.env의 DATABASE_URL이 맞는지 확인하세요.",
      run: () => run("uv", ["run", "alembic", "upgrade", "head"], "backend", "alembic upgrade head"),
    },
    {
      title: "로컬용 관리자 계정 만들기",
      hint: "backend/.env의 SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD 값을 확인하세요.",
      run: () => run("uv", ["run", "python", "-m", "app.users.seed"], "backend", "seed admin"),
    },
  ];
}

async function waitForUrl(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      /* 아직 켜지는 중 */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function startServer(label, cmd, args, cwd, env) {
  // macOS/Linux에서는 별도 프로세스 그룹으로 띄워, 종료할 때 uvicorn·next 자식까지 함께 끈다 (아니면 포트가 남는다)
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, shell: isWin, detached: !isWin, stdio: ["ignore", "pipe", "pipe"] });
  const prefix = dim(`[${label}] `);
  const pipe = (stream, out) =>
    stream.on("data", (buf) => {
      for (const line of buf.toString().split(/\r?\n/)) if (line.trim()) out.write(`${prefix}${line}\n`);
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
}

/** 백엔드와 프론트엔드를 켜고, 종료될 때까지 기다린다. setup과 start가 함께 쓴다. 포트를 바꾸면 서로를 가리키는 주소도 함께 바꾼다(.env 파일은 건드리지 않음). */
export async function startServers(root, { web, api } = DEFAULT_PORTS) {
  info("\n서버를 시작합니다. 끝내려면 Ctrl+C 를 누르세요.");
  const webUrl = `http://localhost:${web}`;
  const custom = web !== DEFAULT_PORTS.web || api !== DEFAULT_PORTS.api;
  const back = startServer("backend", "uv", ["run", "uvicorn", "app.main:app", "--reload", "--port", String(api)], join(root, "backend"), custom ? { CORS_ORIGINS: webUrl, FRONTEND_BASE_URL: webUrl, SOCIAL_REDIRECT_BASE_URL: `${webUrl}/api/auth` } : {});
  const front = startServer("frontend", "npm", ["run", "dev", "--", "-p", String(web)], join(root, "frontend"), custom ? { API_PROXY_TARGET: `http://localhost:${api}`, NEXT_PUBLIC_SITE_URL: webUrl } : {});
  // stop 명령이 찾을 수 있게 프로세스 그룹을 기록해 둔다 (종료하면 지운다)
  if (!isWin) await writePidFile(root, { backend: back.pid, frontend: front.pid, ports: { web, api } });
  // 켜지는 도중에 서버가 먼저 꺼지면(포트 충돌 등) 알려 준다
  const warnOnEarlyExit = (label, child) =>
    child.on("close", (code) => {
      if (code) warn(`${label} 서버가 종료되었습니다 (종료 코드 ${code}). 위의 [${label === "백엔드" ? "backend" : "frontend"}] 로그에서 원인을 확인하세요.`);
    });
  warnOnEarlyExit("백엔드", back);
  warnOnEarlyExit("프론트엔드", front);
  const stop = () => {
    for (const child of [back, front]) {
      try {
        if (isWin) child.kill();
        else process.kill(-child.pid, "SIGTERM");
      } catch {
        /* 이미 종료됨 */
      }
    }
  };
  const quit = () => {
    stop();
    clearPidFile(root).finally(() => process.exit(0));
  };
  process.on("SIGINT", quit);
  process.on("SIGTERM", quit);
  const [b, f] = await Promise.all([waitForUrl(`http://localhost:${api}/health`, 60_000), waitForUrl(webUrl, 90_000)]);
  console.log("");
  if (b && f) {
    ok(`프론트엔드  ${cyan(webUrl)}`);
    ok(`백엔드 API  ${cyan(`http://localhost:${api}/docs`)}`);
    if (custom) warn("기본 포트가 아니라서 소셜 로그인(Google 등)은 로그인 제공자에 등록한 리디렉션 주소와 달라 동작하지 않을 수 있습니다.");
  } else {
    warn("서버가 제때 켜지지 않았습니다. 위의 [backend] / [frontend] 로그를 확인하세요.");
  }
  await new Promise((resolvePromise) => {
    back.on("close", resolvePromise);
    front.on("close", resolvePromise);
  });
  await clearPidFile(root);
  console.log("");
  info(`서버를 종료했습니다. 다시 켜려면 ${cyan("npx @snackcup/meerkit start")} 를 실행하세요.`);
  return 0;
}

export async function runSetup(args) {
  const noStart = args.includes("--no-start");
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    info(`  예: ${cyan("cd my-app")} 한 뒤 ${cyan("npx @snackcup/meerkit setup")}`);
    return 1;
  }
  const parsed = parsePorts(args);
  if (parsed.error) {
    fail(parsed.error);
    return 1;
  }
  const chosen = parsed.ports;
  const logPath = join(root, LOG_NAME);

  info(bold("Meerkit 환경을 점검합니다."));
  const tools = await runToolChecks();
  const ports = await checkPorts([
    { port: chosen.web, name: "프론트엔드" },
    { port: chosen.api, name: "백엔드" },
  ]);
  // 5432는 DB 컨테이너가 이미 우리 것으로 떠 있으면 정상이므로 setup의 DB 단계에서 확인한다.
  if (!printChecks([...tools, ...ports])) return 1;

  const steps = buildSteps(root, logPath);
  for (const [i, s] of steps.entries()) {
    step(i + 1, steps.length, s.title);
    const r = await s.run();
    if (r.code !== 0) {
      printFailure({ title: s.title, cause: r.tail, hint: s.hint, logPath });
      return 1;
    }
    ok(r.note ?? "완료");
  }

  console.log("");
  ok(bold("세팅이 끝났습니다."));
  warn("관리자 계정은 로컬 개발용입니다. 아이디와 비밀번호는 backend/.env 의 SEED_ADMIN_USER_ID, SEED_ADMIN_PASSWORD 에 있고, 운영에서는 반드시 바꾸세요.");
  const portFlags = chosen.web !== DEFAULT_PORTS.web || chosen.api !== DEFAULT_PORTS.api ? ` --port ${chosen.web} --api-port ${chosen.api}` : "";
  if (noStart) {
    info(`서버는 ${cyan(`npx @snackcup/meerkit start${portFlags}`)} 로 켭니다. (직접 켜려면 ${cyan("cd backend && uv run uvicorn app.main:app --reload")}  /  ${cyan("cd frontend && npm run dev")}, DB는 ${cyan("docker compose up -d db")})`);
    return 0;
  }

  return startServers(root, chosen);
}
