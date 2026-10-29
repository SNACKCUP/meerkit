import { join } from "node:path";

import { findProjectRoot } from "./setup.js";
import { missingSetup } from "./start.js";
import { runLogged } from "./run.js";
import { bold, cyan, dim, fail, info, ok } from "./ui.js";

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
    steps.push({ title: "백엔드 pytest", cmd: "uv", args: ["run", "pytest", "-q"], cwd: "backend", hint: "DB가 켜져 있어야 합니다 (npx @snackcup/meerkit start)" });
  }
  if (!onlyBack) {
    steps.push({ title: "프론트엔드 lint", cmd: "npm", args: ["run", "lint"], cwd: "frontend" });
    if (!fast) steps.push({ title: "프론트엔드 build", cmd: "npm", args: ["run", "build"], cwd: "frontend", hint: "next dev가 같은 폴더에서 켜져 있으면 build가 멈출 수 있습니다 (먼저 stop)" });
  }

  info(bold(`확인을 시작합니다 (${steps.length}단계${fast ? ", build 생략" : ""})`));
  const results = [];
  for (const s of steps) {
    const t0 = Date.now();
    process.stdout.write(`${dim("…")} ${s.title}`);
    const r = await runLogged(s.cmd, s.args, { cwd: join(root, s.cwd), label: s.title });
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
    if (f.hint) console.log(`  참고: ${f.hint}`);
  }
  return 1;
}
