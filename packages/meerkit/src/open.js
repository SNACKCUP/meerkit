import { spawn } from "node:child_process";

import { activePorts } from "./ports.js";
import { findProjectRoot } from "./setup.js";
import { cyan, fail, info, ok } from "./ui.js";

const targets = ({ web, api }) => ({
  web: [`http://localhost:${web}`, "프론트엔드"],
  api: [`http://localhost:${api}/docs`, "백엔드 API 문서 (Swagger)"],
});

export function openUrl(url) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

export async function runOpen(args) {
  const target = args.find((a) => !a.startsWith("-")) ?? "web";
  // 프로젝트 안에서 start --port 로 켜 둔 서버가 있으면 그 포트를 연다
  const root = findProjectRoot(process.cwd());
  const TARGETS = targets(root ? await activePorts(root) : { web: 3000, api: 8000 });
  if (!TARGETS[target]) {
    fail(`알 수 없는 대상입니다: ${target}`);
    info(`사용법: ${cyan("npx @snackcup/meerkit open [web|api]")}`);
    return 1;
  }
  const [url, label] = TARGETS[target];
  openUrl(url);
  ok(`${label}를 브라우저로 엽니다: ${cyan(url)}`);
  return 0;
}
