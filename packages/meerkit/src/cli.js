import { readFile } from "node:fs/promises";

import { runAdd } from "./add.js";
import { printChecks, runToolChecks } from "./checks.js";
import { runDb } from "./db.js";
import { runEnv } from "./envcheck.js";
import { helpAll, helpOf } from "./help.js";
import { runInit } from "./init.js";
import { runLogs } from "./logs.js";
import { runOpen } from "./open.js";
import { PACKAGE_JSON } from "./paths.js";
import { runSetup } from "./setup.js";
import { runStart } from "./start.js";
import { runStatus } from "./status.js";
import { runStop } from "./stop.js";
import { runTest } from "./verify.js";
import { info } from "./ui.js";

const RUN = {
  init: runInit,
  setup: runSetup,
  start: runStart,
  stop: runStop,
  status: runStatus,
  check: async () => (printChecks(await runToolChecks()) ? 0 : 1),
  env: runEnv,
  logs: runLogs,
  db: runDb,
  add: runAdd,
  test: runTest,
  open: runOpen,
};

export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === undefined || cmd === "-h" || cmd === "--help") {
    info(helpAll());
    return 0;
  }
  if (cmd === "-v" || cmd === "--version") {
    info(JSON.parse(await readFile(PACKAGE_JSON, "utf8")).version);
    return 0;
  }
  if (cmd === "help") {
    const text = rest[0] ? helpOf(rest[0]) : helpAll();
    if (!text) {
      info(`알 수 없는 명령입니다: ${rest[0]}`);
      info(helpAll());
      return 1;
    }
    info(text);
    return 0;
  }
  if (!RUN[cmd]) {
    info(`알 수 없는 명령입니다: ${cmd}`);
    info(helpAll());
    return 1;
  }
  // 어떤 명령이든 --help / -h 를 붙이면 그 명령의 도움말을 보여 준다
  if (rest.includes("--help") || rest.includes("-h")) {
    info(helpOf(cmd));
    return 0;
  }
  return RUN[cmd](rest);
}
