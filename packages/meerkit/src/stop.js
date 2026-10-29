import { spawnSync } from "node:child_process";

import { findProjectRoot } from "./setup.js";
import { belongsTo, clearPidFile, isAlive, isWin, listenersOf, readPidFile, signal, sleep, treeOf } from "./proc.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

const PORTS = [
  { port: 8000, name: "백엔드" },
  { port: 3000, name: "프론트엔드" },
];

/** 이 프로젝트의 서버(3000·8000)를 끈다. 다른 프로그램이 쓰는 포트는 건드리지 않는다. */
export async function runStop(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  if (isWin) {
    fail("Windows에서는 stop을 아직 지원하지 않습니다. 서버를 띄운 터미널에서 Ctrl+C 를 누르세요.");
    return 1;
  }

  let stopped = 0;
  // 1) start/setup이 기록해 둔 프로세스 그룹
  const rec = await readPidFile(root);
  for (const [label, pgid] of Object.entries(rec ?? {})) {
    if (typeof pgid !== "number" || !isAlive(pgid)) continue;
    if (signal(pgid, "SIGTERM", { group: true })) stopped++;
    info(dim(`  ${label} 프로세스 그룹 ${pgid} 종료 요청`));
  }

  // 2) 기록이 없거나 다른 방법으로 띄운 서버: 포트를 쓰는 프로세스 중 이 프로젝트 것만
  await sleep(rec ? 800 : 0);
  const skipped = [];
  for (const { port, name } of PORTS) {
    for (const { pid, name: proc } of listenersOf(port)) {
      if (!belongsTo(pid, root)) {
        skipped.push(`${port} 포트(${name}): ${proc || "알 수 없음"} (PID ${pid})`);
        continue;
      }
      for (const p of treeOf(pid).reverse()) signal(p, "SIGTERM");
      stopped++;
      info(dim(`  ${port} 포트(${name}) PID ${pid} 종료 요청`));
    }
  }

  // 3) 잠시 기다린 뒤에도 남아 있으면 강제로 끈다 (이 프로젝트 것만)
  for (let i = 0; i < 10; i++) {
    if (PORTS.every(({ port }) => listenersOf(port).filter(({ pid }) => belongsTo(pid, root)).length === 0)) break;
    await sleep(500);
  }
  for (const { port } of PORTS) {
    for (const { pid } of listenersOf(port)) {
      if (!belongsTo(pid, root)) continue;
      for (const p of treeOf(pid).reverse()) signal(p, "SIGKILL");
      warn(`${port} 포트가 정상 종료되지 않아 강제로 끝냈습니다 (PID ${pid}).`);
    }
  }
  await clearPidFile(root);

  if (args.includes("--db")) {
    info("\n데이터베이스를 멈춥니다 (docker compose stop db).");
    const r = spawnSync("docker", ["compose", "stop", "db"], { cwd: root, encoding: "utf8" });
    if (r.status === 0) ok("데이터베이스를 멈췄습니다. 데이터는 그대로입니다.");
    else fail(`데이터베이스를 멈추지 못했습니다: ${(r.stderr || r.stdout || "").trim().split("\n").pop()}`);
  }

  const still = PORTS.filter(({ port }) => listenersOf(port).some(({ pid }) => belongsTo(pid, root)));
  if (still.length) {
    fail(`아직 남은 서버가 있습니다: ${still.map((s) => s.port).join(", ")}`);
    return 1;
  }
  console.log("");
  if (stopped) ok(bold("서버를 모두 종료했습니다."));
  else info("끌 서버가 없었습니다. (이 프로젝트의 서버가 3000/8000에서 실행 중이 아닙니다)");
  for (const s of skipped) warn(`${s}: 이 프로젝트가 아니라서 그대로 두었습니다.`);
  if (!args.includes("--db")) info(dim(`DB도 멈추려면 ${cyan("npx @snackcup/meerkit stop --db")}`));
  return 0;
}
