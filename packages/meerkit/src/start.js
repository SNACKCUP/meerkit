import { existsSync } from "node:fs";
import { join } from "node:path";

import { checkPorts, printChecks, runToolChecks } from "./checks.js";
import { parsePorts } from "./ports.js";
import { runLogged } from "./run.js";
import { findProjectRoot, printFailure, startServers } from "./setup.js";
import { bold, cyan, fail, info, ok } from "./ui.js";

const LOG_NAME = "meerkit-setup.log";

/** setup이 끝난 프로젝트인지 본다. 빠진 것의 이름을 돌려준다. */
export function missingSetup(root) {
  const needed = [
    [join("backend", ".env"), "backend/.env"],
    [join("backend", ".venv"), "backend/.venv (uv sync)"],
    [join("frontend", "node_modules"), "frontend/node_modules (npm install)"],
  ];
  return needed.filter(([f]) => !existsSync(join(root, f))).map(([, label]) => label);
}

/** 세팅이 끝난 프로젝트의 서버만 켠다: DB 확인 → 백엔드 → 프론트엔드. 설치·마이그레이션은 하지 않는다. */
export async function runStart(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    info(`  예: ${cyan("cd my-app")} 한 뒤 ${cyan("npx @snackcup/meerkit start")}`);
    return 1;
  }
  const parsed = parsePorts(args);
  if (parsed.error) {
    fail(parsed.error);
    return 1;
  }
  const { ports: chosen } = parsed;
  const missing = missingSetup(root);
  if (missing.length) {
    fail(`아직 세팅이 끝나지 않았습니다. 없는 것: ${missing.join(", ")}`);
    info(`  먼저 ${cyan("npx @snackcup/meerkit setup")} 을 실행하세요. (setup은 설치·DB·관리자 계정까지 준비하고 서버를 켭니다)`);
    return 1;
  }

  info(bold("서버를 켤 준비를 합니다."));
  const tools = await runToolChecks();
  const ports = await checkPorts([
    { port: chosen.web, name: "프론트엔드" },
    { port: chosen.api, name: "백엔드" },
  ]);
  if (!printChecks([...tools, ...ports])) return 1;

  // DB는 이미 켜져 있으면 그대로 두고, 꺼져 있으면 켠다 (--no-db 이면 건드리지 않는다)
  if (!args.includes("--no-db")) {
    const logPath = join(root, LOG_NAME);
    info("\n데이터베이스를 확인합니다 (docker compose).");
    const r = await runLogged("docker", ["compose", "up", "-d", "--wait", "db"], { cwd: root, logFile: logPath, label: "start: docker compose up" });
    if (r.code !== 0) {
      printFailure({
        title: "데이터베이스 실행",
        cause: r.tail,
        hint: "Docker Desktop이 실행 중인지, 5432 포트를 다른 프로그램이 쓰고 있지 않은지 확인하세요.",
        logPath,
        retry: "start",
      });
      return 1;
    }
    ok("데이터베이스 실행 중");
  }
  return startServers(root, chosen);
}
