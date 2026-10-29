import { spawnSync } from "node:child_process";
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
  if (r.error || r.status === null) return { ok: false, out: "", err: r.error?.message ?? "" };
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
  results.push(
    d.ok
      ? { id: "docker-running", label: "Docker Desktop 실행", ok: true, detail: "실행 중" }
      : { id: "docker-running", label: "Docker Desktop 실행", ok: false, detail: "실행 중이 아님", fix: "Docker Desktop을 실행하고 완전히 켜질 때까지 기다린 뒤 다시 시도하세요." },
  );
  return results;
}

export function isPortFree(port) {
  return new Promise((resolvePromise) => {
    const srv = net.createServer();
    srv.once("error", () => resolvePromise(false));
    srv.once("listening", () => srv.close(() => resolvePromise(true)));
    srv.listen(port, "127.0.0.1");
  });
}

/** 서버가 쓸 포트가 비어 있는지 본다. */
export async function checkPorts(ports, free = isPortFree) {
  const results = [];
  for (const { port, name } of ports) {
    const isFree = await free(port);
    results.push(
      isFree
        ? { id: `port-${port}`, label: `${port} 포트 (${name})`, ok: true, detail: "사용 가능" }
        : { id: `port-${port}`, label: `${port} 포트 (${name})`, ok: false, detail: "이미 사용 중", fix: `${port} 포트를 쓰는 프로그램을 종료하세요. (macOS/Linux: lsof -i :${port}, Windows: netstat -ano | findstr :${port})` },
    );
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
export async function runToolChecks() {
  return [checkNode(), checkNpm(), checkUv(), ...checkDocker()];
}
