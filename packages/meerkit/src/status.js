import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { belongsTo, isWin, listenersOf } from "./proc.js";
import { activePorts } from "./ports.js";
import { findProjectRoot } from "./setup.js";
import { missingSetup } from "./start.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

async function httpStatus(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.status;
  } catch {
    return null;
  }
}

/** db 컨테이너 상태: { state: "running"|"exited"|..., health } 또는 null(컨테이너 없음/도커 꺼짐) */
export function dbContainer(root) {
  const q = spawnSync("docker", ["compose", "ps", "-q", "db"], { cwd: root, encoding: "utf8" });
  const id = q.status === 0 ? q.stdout.trim().split("\n")[0] : "";
  if (!id) return null;
  const r = spawnSync("docker", ["inspect", "-f", "{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{end}}", id], { encoding: "utf8" });
  if (r.status !== 0) return null;
  const [state, health] = r.stdout.trim().split("|");
  return { state, health };
}

/** alembic이 최신인지: "head" | "behind" | "empty" | "unknown" */
export function migrationState(root) {
  const r = spawnSync("uv", ["run", "alembic", "current"], { cwd: join(root, "backend"), encoding: "utf8", timeout: 30_000 });
  if (r.status !== 0) return "unknown";
  const text = `${r.stdout}\n${r.stderr}`;
  if (/\(head\)/.test(text)) return "head";
  if (/^[0-9a-f]{6,}/m.test(r.stdout)) return "behind";
  return "empty";
}

function portLine(root, port, label) {
  const ls = listenersOf(port);
  if (!ls.length) return { running: false, text: `${label} (${port}): 꺼져 있음` };
  const mine = ls.some(({ pid }) => belongsTo(pid, root));
  const who = ls.map((l) => `${l.name} PID ${l.pid}`).join(", ");
  return { running: true, mine, text: `${label} (${port}): 켜져 있음 (${who})${mine ? "" : " ← 이 프로젝트가 아닌 프로그램입니다"}` };
}

/** 프로젝트가 지금 어떤 상태인지 한눈에 보여 준다. */
export async function runStatus(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  info(bold(`Meerkit 상태  ${dim(root)}`));
  console.log("");

  const missing = missingSetup(root);
  if (missing.length) warn(`세팅: 아직 안 된 것 → ${missing.join(", ")}  (${cyan("npx @snackcup/meerkit setup")})`);
  else ok("세팅: 끝남 (.env, 백엔드·프론트엔드 라이브러리)");

  const db = dbContainer(root);
  const dbUp = db?.state === "running" && (db.health === "healthy" || db.health === "");
  if (!db) warn(`DB: 컨테이너가 없거나 Docker가 꺼져 있음  (${cyan("npx @snackcup/meerkit start")})`);
  else if (dbUp) ok(`DB: 실행 중 (${db.health || db.state})`);
  else warn(`DB: ${db.state}${db.health ? `, ${db.health}` : ""}  (${cyan("npx @snackcup/meerkit start")})`);

  if (dbUp && !missing.length && existsSync(join(root, "backend", ".venv"))) {
    const m = migrationState(root);
    if (m === "head") ok("마이그레이션: 최신");
    else if (m === "behind") warn(`마이그레이션: 최신이 아님  (${cyan("npx @snackcup/meerkit db migrate")})`);
    else if (m === "empty") warn(`마이그레이션: 테이블이 아직 없음  (${cyan("npx @snackcup/meerkit db migrate")})`);
    else warn("마이그레이션: 확인하지 못함 (backend/.env의 DATABASE_URL을 확인하세요)");
  }

  const ports = await activePorts(root);
  const be = portLine(root, ports.api, "백엔드");
  const fe = portLine(root, ports.web, "프론트엔드");
  for (const [p, label, url, okCodes] of [
    [be, "백엔드", `http://localhost:${ports.api}/health`, [200]],
    [fe, "프론트엔드", `http://localhost:${ports.web}`, [200]],
  ]) {
    if (!p.running) {
      info(`${dim("·")} ${p.text}`);
      continue;
    }
    if (!p.mine) {
      warn(p.text);
      continue;
    }
    const code = await httpStatus(url);
    if (code && okCodes.includes(code)) ok(`${p.text} → 응답 ${code}`);
    else warn(`${p.text} → 응답 ${code ?? "없음"} (켜지는 중이거나 오류)`);
  }

  console.log("");
  if (!be.running && !fe.running) info(`서버를 켜려면 ${cyan("npx @snackcup/meerkit start")}`);
  else info(`서버를 끄려면 ${cyan("npx @snackcup/meerkit stop")}`);
  if (isWin) info(dim("Windows에서는 포트 소유자를 표시하지 못합니다."));
  return 0;
}
