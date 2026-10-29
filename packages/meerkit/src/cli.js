import { readFile } from "node:fs/promises";

import { printChecks, runToolChecks } from "./checks.js";
import { runInit } from "./init.js";
import { PACKAGE_JSON } from "./paths.js";
import { runSetup } from "./setup.js";
import { bold, cyan, info } from "./ui.js";

const HELP = `
${bold("meerkit")} — Meerkit 스타터킷 CLI

사용법
  ${cyan("npx create-meerkit <폴더이름>")}   새 프로젝트를 만듭니다 (meerkit init 과 같습니다)
  ${cyan("npx meerkit init <폴더이름>")}     새 프로젝트를 만듭니다
  ${cyan("npx meerkit setup")}              프로젝트 폴더 안에서 실행: 환경 점검, 설치, DB, 관리자 계정, 서버 시작
      --no-start   서버는 켜지 않고 세팅만 합니다
  ${cyan("npx meerkit check")}              개발 환경(Node, uv, Docker)만 점검합니다
  ${cyan("npx meerkit --version")}
`;

export async function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "init":
      return runInit(rest);
    case "setup":
      return runSetup(rest);
    case "check":
      return printChecks(await runToolChecks()) ? 0 : 1;
    case "-v":
    case "--version":
      info(JSON.parse(await readFile(PACKAGE_JSON, "utf8")).version);
      return 0;
    case undefined:
    case "-h":
    case "--help":
      info(HELP);
      return 0;
    default:
      info(`알 수 없는 명령입니다: ${cmd}`);
      info(HELP);
      return 1;
  }
}
