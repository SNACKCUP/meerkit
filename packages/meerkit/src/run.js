import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";

const isWin = process.platform === "win32";

/**
 * 명령을 실행하고 출력은 로그 파일에 쌓는다. 화면에는 내보내지 않는다.
 * 끝나면 { code, tail }을 돌려준다. tail은 마지막 tailLines줄(실패 원인 안내용, 기본 12).
 */
export function runLogged(cmd, args, { cwd, logFile, env, label, tailLines = 12 } = {}) {
  return new Promise((resolvePromise) => {
    const log = logFile ? createWriteStream(logFile, { flags: "a" }) : null;
    log?.write(`\n$ ${[cmd, ...args].join(" ")}   (cwd: ${cwd ?? "."})${label ? `  # ${label}` : ""}\n`);
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, shell: isWin, stdio: ["ignore", "pipe", "pipe"] });
    const tail = [];
    const onData = (buf) => {
      const text = buf.toString();
      log?.write(text);
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) tail.push(line);
      }
      if (tail.length > tailLines) tail.splice(0, tail.length - tailLines);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (e) => {
      log?.write(`\n[spawn error] ${e.message}\n`);
      log?.end();
      resolvePromise({ code: 127, tail: [e.message] });
    });
    child.on("close", (code) => {
      log?.end();
      resolvePromise({ code: code ?? 1, tail });
    });
  });
}
