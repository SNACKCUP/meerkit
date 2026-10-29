import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { findProjectRoot } from "./setup.js";
import { cyan, dim, fail, info } from "./ui.js";

const LOG_NAME = "meerkit-setup.log";

export async function runLogs(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  const file = join(root, LOG_NAME);
  if (args.includes("--path")) {
    info(file);
    return 0;
  }
  if (!existsSync(file)) {
    info(`${LOG_NAME} 가 아직 없습니다. ${cyan("npx @snackcup/meerkit setup")} 을 실행하면 만들어집니다.`);
    return 0;
  }
  const nIdx = args.indexOf("-n");
  const n = nIdx >= 0 ? Math.max(1, Number(args[nIdx + 1]) || 50) : 50;
  const lines = (await readFile(file, "utf8")).split(/\r?\n/);
  info(dim(`${file}  (마지막 ${n}줄)`));
  info(lines.slice(-n - 1).join("\n"));
  return 0;
}
