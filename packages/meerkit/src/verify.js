import { rmSync } from "node:fs";
import { join } from "node:path";

import { findProjectRoot } from "./setup.js";
import { missingSetup } from "./start.js";
import { runLogged } from "./run.js";
import { bold, cyan, dim, fail, info, ok } from "./ui.js";

const LOG_NAME = "meerkit-test.log";

/**
 * 실패 출력에 이 모양이 있을 때만 힌트를 보여 준다. 단순한 테스트·타입 오류에 엉뚱한 안내가 붙지 않게 한다.
 */
export const shouldHint = (step, tail) => !step.hintWhen || step.hintWhen.test(tail.join("\n"));

/** 백엔드 ruff·pytest, 프론트엔드 lint·build 를 차례로 돌리고 결과를 한눈에 보여 준다. */
export async function runTest(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
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
  const onlyBack = args.includes("--backend");
  const onlyFront = args.includes("--frontend");
  const fast = args.includes("--fast");

  const steps = [];
  if (!onlyFront) {
    steps.push({ title: "백엔드 ruff", cmd: "uv", args: ["run", "ruff", "check", "."], cwd: "backend" });
    steps.push({ title: "백엔드 pytest", cmd: "uv", args: ["run", "pytest", "-q"], cwd: "backend", hint: "DB에 연결하지 못한 것 같습니다. DB가 켜져 있어야 합니다 (npx @snackcup/meerkit start)", hintWhen: /OperationalError|connection (refused|failed)|could not connect|Connection refused|psycopg/i });
  }
  if (!onlyBack) {
    steps.push({ title: "프론트엔드 lint", cmd: "npm", args: ["run", "lint"], cwd: "frontend" });
    if (!fast) steps.push({ title: "프론트엔드 build", cmd: "npm", args: ["run", "build"], cwd: "frontend", hint: "next dev가 같은 폴더에서 켜져 있는 것 같습니다 (먼저 npx @snackcup/meerkit stop)", hintWhen: /lock|EADDRINUSE|another .*next|already running/i });
  }

  info(bold(`확인을 시작합니다 (${steps.length}단계${fast ? ", build 생략" : ""})`));
  const logPath = join(root, LOG_NAME);
  rmSync(logPath, { force: true }); // 이번 실행의 출력만 남긴다
  const results = [];
  for (const s of steps) {
    const t0 = Date.now();
    process.stdout.write(`${dim("…")} ${s.title}`);
    const r = await runLogged(s.cmd, s.args, { cwd: join(root, s.cwd), label: s.title, logFile: logPath, tailLines: 40 });
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write("\r\x1b[K");
    results.push({ ...s, code: r.code, tail: r.tail, sec });
    if (r.code === 0) ok(`${s.title} ${dim(`${sec}초`)}`);
    else fail(`${s.title} ${dim(`${sec}초`)}`);
  }

  const failed = results.filter((r) => r.code !== 0);
  console.log("");
  if (!failed.length) {
    ok(bold("모두 통과했습니다."));
    return 0;
  }
  for (const f of failed) {
    fail(bold(`${f.title} 실패`));
    for (const line of f.tail) console.log(`    ${dim(line.slice(0, 160))}`);
    if (f.hint && shouldHint(f, f.tail)) console.log(`  참고: ${f.hint}`);
  }
  console.log(`\n전체 출력은 ${cyan(LOG_NAME)} 에 있습니다. (마지막 ${40}줄만 위에 보여 줍니다)`);
  return 1;
}
