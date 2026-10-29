import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const isWin = process.platform === "win32";

/** 프로젝트별 PID 기록 파일. 프로젝트 폴더를 더럽히지 않으려고 임시 폴더에 둔다. */
export const pidFilePath = (root) => join(tmpdir(), `meerkit-${createHash("sha1").update(root).digest("hex").slice(0, 10)}.json`);

export async function writePidFile(root, data) {
  await writeFile(pidFilePath(root), JSON.stringify({ root, ...data }));
}
export async function readPidFile(root) {
  try {
    return JSON.parse(await readFile(pidFilePath(root), "utf8"));
  } catch {
    return null;
  }
}
export const clearPidFile = (root) => rm(pidFilePath(root), { force: true });

/** 포트에서 기다리는(LISTEN) 프로세스 목록 [{ pid, name }]. macOS/Linux의 lsof. 알 수 없으면 빈 배열. */
export function listenersOf(port) {
  if (isWin) return [];
  const r = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return [];
  const out = [];
  let cur = null;
  for (const line of r.stdout.split("\n")) {
    if (line.startsWith("p")) {
      cur = { pid: Number(line.slice(1)), name: "" };
      out.push(cur);
    } else if (line.startsWith("c") && cur) cur.name = line.slice(1);
  }
  return out.filter((p, i) => out.findIndex((q) => q.pid === p.pid) === i);
}

export function commandOf(pid) {
  const r = spawnSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

/** 프로세스의 현재 작업 폴더 (lsof). 알 수 없으면 "". next-server 처럼 명령줄에 경로가 없는 프로세스를 알아보는 데 쓴다. */
export function cwdOf(pid) {
  if (isWin) return "";
  const r = spawnSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], { encoding: "utf8" });
  const line = r.status === 0 ? r.stdout.split("\n").find((l) => l.startsWith("n")) : null;
  return line ? line.slice(1) : "";
}

/** 이 프로세스가 root 프로젝트의 것인지: 명령줄에 경로가 있거나, 작업 폴더가 프로젝트 안이다. */
export function belongsTo(pid, root) {
  return commandOf(pid).includes(root) || cwdOf(pid).startsWith(root);
}

export function childrenOf(pid) {
  const r = spawnSync("pgrep", ["-P", String(pid)], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split("\n").filter(Boolean).map(Number) : [];
}

/** pid와 그 자손 pid 전부 */
export function treeOf(pid) {
  const all = [pid];
  for (const c of childrenOf(pid)) all.push(...treeOf(c));
  return all;
}

export function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 프로세스 그룹(pgid) 또는 pid들에 신호를 보낸다. 이미 없으면 조용히 넘어간다. */
export function signal(target, sig, { group = false } = {}) {
  try {
    process.kill(group ? -target : target, sig);
    return true;
  } catch {
    return false;
  }
}

export function exists(p) {
  return existsSync(p);
}
