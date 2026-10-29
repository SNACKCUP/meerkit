import { spawn } from "node:child_process";

import { cyan, fail, info, ok } from "./ui.js";

const TARGETS = {
  web: ["http://localhost:3000", "프론트엔드"],
  api: ["http://localhost:8000/docs", "백엔드 API 문서 (Swagger)"],
};

export function openUrl(url) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

export async function runOpen(args) {
  const target = args.find((a) => !a.startsWith("-")) ?? "web";
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
