import { spawnSync } from "node:child_process";
import { statfsSync } from "node:fs";
import net from "node:net";

import { fail, ok, warn, bold, dim } from "./ui.js";

const isWin = process.platform === "win32";

export const LINKS = {
  node: "https://nodejs.org/ko/download",
  uv: "https://docs.astral.sh/uv/getting-started/installation/",
  docker: "https://www.docker.com/products/docker-desktop/",
};

export const MIN_NODE_MAJOR = 20;

function tryRun(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: isWin, timeout: 20_000 });
  if (r.error || r.status === null) return { ok: false, timedOut: r.error?.code === "ETIMEDOUT", out: "", err: r.error?.message ?? "" };
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

const firstLine = (s) => s.split(/\r?\n/)[0] ?? "";

/** 점검 결과 한 건: { id, label, ok, detail, fix?, url? } */
export function checkNode(version = process.versions.node) {
  const major = Number(version.split(".")[0]);
  if (major >= MIN_NODE_MAJOR) return { id: "node", label: "Node.js", ok: true, detail: `v${version}` };
  return { id: "node", label: "Node.js", ok: false, detail: `v${version} (Node.js ${MIN_NODE_MAJOR} 이상 필요)`, fix: `Node.js ${MIN_NODE_MAJOR} 이상으로 업데이트하세요.`, url: LINKS.node };
}

export function checkNpm(run = tryRun) {
  const r = run("npm", ["--version"]);
  if (r.ok) return { id: "npm", label: "npm", ok: true, detail: `v${firstLine(r.out)}` };
  return { id: "npm", label: "npm", ok: false, detail: "찾을 수 없음", fix: "Node.js를 설치하면 npm도 함께 설치됩니다.", url: LINKS.node };
}

export function checkUv(run = tryRun) {
  const r = run("uv", ["--version"]);
  if (r.ok) return { id: "uv", label: "uv (Python 패키지 도구)", ok: true, detail: firstLine(r.out) };
  return { id: "uv", label: "uv (Python 패키지 도구)", ok: false, detail: "찾을 수 없음", fix: "uv를 설치하세요. Python 3.12는 uv가 알아서 설치합니다.", url: LINKS.uv };
}

/** Docker는 세 단계로 본다: 설치됨 → compose 사용 가능 → Docker Desktop이 실행 중 */
export function checkDocker(run = tryRun) {
  const results = [];
  const v = run("docker", ["--version"]);
  if (!v.ok) {
    results.push({ id: "docker", label: "Docker", ok: false, detail: "찾을 수 없음", fix: "Docker Desktop을 설치하세요.", url: LINKS.docker });
    return results;
  }
  results.push({ id: "docker", label: "Docker", ok: true, detail: firstLine(v.out) });

  const c = run("docker", ["compose", "version"]);
  results.push(
    c.ok
      ? { id: "compose", label: "Docker Compose", ok: true, detail: firstLine(c.out) }
      : { id: "compose", label: "Docker Compose", ok: false, detail: "사용할 수 없음", fix: "Docker Desktop을 최신 버전으로 업데이트하세요 (Compose v2 필요).", url: LINKS.docker },
  );

  const d = run("docker", ["info"]);
  if (d.ok) results.push({ id: "docker-running", label: "Docker Desktop 실행", ok: true, detail: "실행 중" });
  else if (d.timedOut) {
    // 켜져 있는데 응답이 없는 경우. 디스크가 가득 차면 Docker 가상 디스크가 멈춰서 이렇게 된다.
    results.push({
      id: "docker-running",
      label: "Docker Desktop 실행",
      ok: false,
      detail: "응답이 없음",
      fix: "Docker Desktop이 켜져 있어도 멈췄을 수 있습니다. 디스크 여유 공간이 부족하면 Docker가 멈추니 먼저 공간을 확보하고, Docker Desktop을 재시작한 뒤 다시 시도하세요.",
    });
  } else results.push({ id: "docker-running", label: "Docker Desktop 실행", ok: false, detail: "실행 중이 아님", fix: "Docker Desktop을 실행하고 완전히 켜질 때까지 기다린 뒤 다시 시도하세요." });
  return results;
}

// 한 주소에서 listen 해 본다. 그 주소를 쓸 수 없는 환경(IPv6 없음 등)은 막힌 것이 아니므로 비어 있다고 본다.
function canListen(port, host) {
  return new Promise((resolvePromise) => {
    const srv = net.createServer();
    srv.once("error", (e) => resolvePromise(e.code === "EAFNOSUPPORT" || e.code === "EADDRNOTAVAIL"));
    srv.once("listening", () => srv.close(() => resolvePromise(true)));
    srv.listen(port, host);
  });
}

/**
 * 포트가 비어 있는지 본다. uvicorn은 127.0.0.1, next·Node 는 모든 주소(::)에 붙으므로 둘 다 확인한다.
 * (한쪽만 보면 다른 쪽에 붙은 프로그램을 놓쳐서, 점검은 통과하는데 서버가 EADDRINUSE 로 죽는다.)
 */
export async function isPortFree(port) {
  return (await canListen(port, "127.0.0.1")) && (await canListen(port, undefined));
}

/** 포트를 쓰는 프로그램을 알아낸다 (macOS/Linux의 lsof). 알 수 없으면 null. 예: "node (PID 1234)" */
export function whoUsesPort(port) {
  if (process.platform === "win32") return null;
  const r = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return null;
  let pid = null;
  let name = null;
  for (const line of r.stdout.split("\n")) {
    if (line.startsWith("p") && pid === null) pid = line.slice(1);
    if (line.startsWith("c") && name === null) name = line.slice(1);
  }
  return pid ? `${name ?? "알 수 없음"} (PID ${pid})` : null;
}

/** 서버가 쓸 포트가 비어 있는지 본다. */
export async function checkPorts(ports, free = isPortFree, who = whoUsesPort) {
  const results = [];
  for (const { port, name } of ports) {
    const isFree = await free(port);
    if (isFree) {
      results.push({ id: `port-${port}`, label: `${port} 포트 (${name})`, ok: true, detail: "사용 가능" });
      continue;
    }
    const user = who(port);
    results.push({
      id: `port-${port}`,
      label: `${port} 포트 (${name})`,
      ok: false,
      detail: user ? `이미 사용 중: ${user}` : "이미 사용 중",
      fix: `${port} 포트를 쓰는 프로그램을 종료하세요. 이전에 띄운 서버일 수 있습니다. (macOS/Linux: lsof -nP -iTCP:${port} -sTCP:LISTEN, Windows: netstat -ano | findstr :${port})`,
    });
  }
  return results;
}

export function printChecks(results) {
  for (const r of results) {
    if (r.ok) ok(`${r.label} ${dim(r.detail)}`);
    else {
      fail(`${bold(r.label)} ${r.detail}`);
      if (r.fix) console.log(`    → ${r.fix}`);
      if (r.url) console.log(`    → 설치/안내: ${r.url}`);
    }
  }
  const bad = results.filter((r) => !r.ok);
  if (bad.length) warn(`${bad.length}개 항목을 해결한 뒤 다시 실행해 주세요.`);
  return bad.length === 0;
}

/** setup에 필요한 도구를 모두 점검한다 (하나가 없어도 끝까지 보고 한꺼번에 알려 준다). */
// 설치(node_modules, .venv, Docker 이미지)에 필요한 여유 공간. 이보다 적으면 중간에 ENOSPC 로 멈춘다.
export const MIN_FREE_GB = 2;

/** 디스크 여유 공간 점검. freeBytes 를 못 구하면(null) 통과로 본다. */
export function checkDisk(freeBytes) {
  if (freeBytes == null) return { id: "disk", label: "디스크 여유 공간", ok: true, detail: "확인하지 못함" };
  const gb = freeBytes / 1024 ** 3;
  const text = `${gb.toFixed(1)}GB`;
  if (gb >= MIN_FREE_GB) return { id: "disk", label: "디스크 여유 공간", ok: true, detail: text };
  return {
    id: "disk",
    label: "디스크 여유 공간",
    ok: false,
    detail: `${text} 남음 (최소 ${MIN_FREE_GB}GB 필요)`,
    fix: "디스크 공간이 부족하면 npm install이 ENOSPC 오류로 멈추고 Docker도 응답하지 않습니다. 안 쓰는 파일이나 오래된 node_modules를 지워 공간을 확보하세요.",
  };
}

function freeDiskBytes(dir = process.cwd()) {
  try {
    const st = statfsSync(dir);
    return st.bavail * st.bsize;
  } catch {
    return null;
  }
}

export async function runToolChecks() {
  return [checkDisk(freeDiskBytes()), checkNode(), checkNpm(), checkUv(), ...checkDocker()];
}
