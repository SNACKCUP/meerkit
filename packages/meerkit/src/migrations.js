import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { cyan } from "./ui.js";

/** alembic이 최신인지: "head" | "behind" | "empty" | "unknown" */
export function migrationState(root) {
  const r = spawnSync("uv", ["run", "alembic", "current"], { cwd: join(root, "backend"), encoding: "utf8", timeout: 30_000 });
  if (r.status !== 0) return "unknown";
  const text = `${r.stdout}\n${r.stderr}`;
  if (/\(head\)/.test(text)) return "head";
  if (/^[0-9a-f]{6,}/m.test(r.stdout)) return "behind";
  return "empty";
}

/** 서버를 켤 때 보여 줄 경고. 최신이거나 확인하지 못했으면 null. */
export function migrationWarning(state) {
  const fix = cyan("npx @snackcup/meerkit db migrate");
  if (state === "behind") return `DB 마이그레이션이 최신이 아닙니다. 코드를 받거나(git pull) 브랜치를 바꾼 뒤라면 ${fix} 을 실행하세요. 서버는 켜지지만 새 기능이 서버 오류(500)를 낼 수 있습니다.`;
  if (state === "empty") return `DB에 테이블이 아직 없습니다. ${fix} 을 실행하세요.`;
  return null;
}
