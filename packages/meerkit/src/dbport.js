import { spawnSync } from "node:child_process";

import { databaseTarget } from "./db.js";
import { listenersOf } from "./proc.js";

const isWin = process.platform === "win32";

/** `docker compose port db 5432` 출력("0.0.0.0:5432" 등)에서 호스트 포트를 꺼낸다. 열려 있지 않으면 null. */
export function parseMappedPort(stdout) {
  const m = String(stdout ?? "").trim().split(/\r?\n/)[0]?.match(/:(\d+)$/);
  const port = m ? Number(m[1]) : 0;
  return port > 0 ? port : null;
}

/** 호스트의 해당 포트를 쓰는 도커 컨테이너 이름들. */
function containersOn(port) {
  const r = spawnSync("docker", ["ps", "--filter", `publish=${port}`, "--format", "{{.Names}}"], { encoding: "utf8", shell: isWin });
  return r.status === 0 ? r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * 이 프로젝트의 DB 컨테이너가 backend/.env 의 DATABASE_URL 이 가리키는 포트로 열려 있는지 확인한다.
 * 다른 컨테이너가 그 포트를 쓰고 있으면 우리 DB가 아닌 곳에 마이그레이션·시드가 실행되므로, 그 전에 알려 준다.
 * 문제가 없으면(또는 확인할 수 없으면) null, 있으면 { summary, lines, fixes } 를 돌려준다.
 */
export async function checkDbPort(root) {
  const target = await databaseTarget(root);
  if (!target?.local) return null; // 원격 DB는 compose DB가 아니므로 확인하지 않는다
  const want = target.port;
  const r = spawnSync("docker", ["compose", "port", "db", "5432"], { cwd: root, encoding: "utf8", shell: isWin });
  if (r.error || r.status === null) return null; // docker를 실행하지 못했다면 다른 점검이 알려 준다
  const mapped = r.status === 0 ? parseMappedPort(r.stdout) : null;
  if (mapped === want) return null;

  if (mapped) {
    return {
      summary: `이 프로젝트의 DB는 ${mapped} 포트로 열려 있는데, backend/.env의 DATABASE_URL은 ${want} 포트를 가리킵니다`,
      lines: [`docker-compose.yml의 DB 포트: ${mapped}`, `backend/.env의 DATABASE_URL 포트: ${want}`],
      fixes: [`둘 중 하나를 맞추세요: docker-compose.yml의 ports를 "${want}:5432"로, 또는 backend/.env의 DATABASE_URL·TEST_DATABASE_URL 포트를 ${mapped}로`],
    };
  }

  const holders = containersOn(want);
  const procs = holders.length ? [] : listenersOf(want).map((p) => `${p.name} (PID ${p.pid})`);
  const who = holders.length ? `${holders.join(", ")} 컨테이너` : procs.length ? procs.join(", ") : "다른 프로그램";
  return {
    summary: `${want} 포트를 ${who}가 쓰고 있어 이 프로젝트의 DB가 ${want}로 열리지 않았습니다`,
    lines: [
      `이 프로젝트의 DB 컨테이너는 켜졌지만 호스트 ${want} 포트에 연결되지 않았습니다.`,
      `그대로 진행하면 마이그레이션과 관리자 계정 생성이 ${who}의 DB에서 실행되므로 여기서 멈춥니다.`,
    ],
    fixes: [
      holders.length
        ? `그 DB가 필요 없다면 멈추기: docker stop ${holders[0]}  (데이터가 필요한 DB라면 멈추지 마세요)`
        : `${want} 포트를 쓰는 프로그램을 끄세요. 확인: lsof -nP -iTCP:${want} -sTCP:LISTEN  (Windows: netstat -ano | findstr :${want})`,
      `또는 이 프로젝트의 포트를 바꾸기: docker-compose.yml의 ports와 backend/.env의 DATABASE_URL·TEST_DATABASE_URL 포트를 같은 값(예: 5433)으로`,
      "다시 실행: 이미 끝난 단계는 건너뜁니다",
    ],
  };
}
