import { randomBytes } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER = /^JWT_SECRET_KEY=(change-me.*)?$/m;
// .env.example에 적힌 모두가 아는 관리자 비밀번호. 프로젝트마다 새로 만든 값으로 바꾼다
const ADMIN_PASSWORD_DEFAULT = /^SEED_ADMIN_PASSWORD=meerkit-local-admin$/m;

export const generateSecret = () => randomBytes(48).toString("base64url");
export const generateAdminPassword = () => randomBytes(12).toString("base64url");

/**
 * 환경 변수 파일을 준비한다. 이미 있는 값은 덮어쓰지 않는다.
 * - backend/.env 가 없으면 .env.example을 복사하고 JWT_SECRET_KEY를 새로 만든다.
 * - 있는데 JWT_SECRET_KEY나 SEED_ADMIN_PASSWORD가 예시 값 그대로면 그 줄만 새 값으로 바꾼다.
 * - frontend/.env.local 이 없으면 .env.example을 복사한다.
 * 만든 파일 이름 목록을 돌려준다. 비밀 값은 돌려주지도 출력하지도 않는다.
 */
export async function ensureEnvFiles(root) {
  const done = [];
  const backendEnv = join(root, "backend", ".env");
  const backendExample = join(root, "backend", ".env.example");
  if (!existsSync(backendEnv)) {
    if (!existsSync(backendExample)) throw new Error("backend/.env.example 을 찾을 수 없습니다.");
    await copyFile(backendExample, backendEnv);
    done.push("backend/.env");
  }
  let text = await readFile(backendEnv, "utf8");
  const before = text;
  if (PLACEHOLDER.test(text)) text = text.replace(PLACEHOLDER, `JWT_SECRET_KEY=${generateSecret()}`);
  if (ADMIN_PASSWORD_DEFAULT.test(text)) text = text.replace(ADMIN_PASSWORD_DEFAULT, `SEED_ADMIN_PASSWORD=${generateAdminPassword()}`);
  if (text !== before) {
    await writeFile(backendEnv, text);
    if (!done.includes("backend/.env")) done.push("backend/.env (비밀키, 관리자 비밀번호)");
  }

  const frontEnv = join(root, "frontend", ".env.local");
  const frontExample = join(root, "frontend", ".env.example");
  if (!existsSync(frontEnv) && existsSync(frontExample)) {
    await copyFile(frontExample, frontEnv);
    done.push("frontend/.env.local");
  }
  return done;
}
