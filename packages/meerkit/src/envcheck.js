import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { findProjectRoot } from "./setup.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

const EXAMPLE_JWT = /^change-me/;
const KNOWN_ADMIN_PASSWORD = "meerkit-local-admin";
const LOCAL = /(localhost|127\.0\.0\.1|\[::1\])/;

/** KEY=VALUE 줄을 읽는다. 주석·빈 줄은 건너뛰고 값의 따옴표는 벗긴다. */
export function parseEnv(text) {
  const map = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return map;
}

/**
 * 설정값을 점검해 { results: [{ level: "error"|"warn"|"ok", text }], hidden } 를 돌려준다. 값 자체는 결과에 담지 않는다(비밀 보호).
 * prod=true 이면 운영에서 위험한 값을 error 로 본다. 아니면(로컬) 그런 항목은 숨기고 개수(hidden)만 알려 준다.
 */
export function checkEnv(env, { prod = false } = {}) {
  const out = [];
  let hidden = 0;
  const add = (level, text) => out.push({ level, text });
  const bad = (text) => (prod ? add("error", text) : hidden++);

  const jwt = env.JWT_SECRET_KEY ?? "";
  if (!jwt) add("error", "JWT_SECRET_KEY 가 비어 있습니다.");
  else if (EXAMPLE_JWT.test(jwt)) add("error", "JWT_SECRET_KEY 가 예시 값 그대로입니다. 누구나 토큰을 만들 수 있습니다 (npx @snackcup/meerkit setup 이 새 값을 만듭니다).");
  else if (jwt.length < 32) add("error", "JWT_SECRET_KEY 가 32자보다 짧습니다.");
  else add("ok", "JWT_SECRET_KEY: 예시 값이 아니고 충분히 깁니다.");

  if (env.SEED_ADMIN_PASSWORD === KNOWN_ADMIN_PASSWORD) add("error", "SEED_ADMIN_PASSWORD 가 모두가 아는 예시 값입니다.");
  else if (env.SEED_ADMIN_PASSWORD) bad("SEED_ADMIN_PASSWORD 가 설정되어 있습니다. 로컬 개발용입니다. 운영에서는 지우거나 안전한 값으로 바꾸고 관리자 계정을 따로 만드세요.");

  if ((env.APP_ENV ?? "local") === "local") bad("APP_ENV 가 local 입니다.");
  if ((env.COOKIE_SECURE ?? "false") !== "true") bad("COOKIE_SECURE 가 true 가 아닙니다 (HTTPS에서는 켜야 합니다).");
  if ((env.API_DOCS_ENABLED ?? "true") === "true") bad("API_DOCS_ENABLED 가 true 입니다 (/docs 가 공개됩니다).");
  if (["console", "fake", ""].includes(env.MAIL_BACKEND ?? "console")) bad(`MAIL_BACKEND 가 ${env.MAIL_BACKEND ? `${env.MAIL_BACKEND} 입니다` : "비어 있습니다"} (실제 메일이 나가지 않습니다).`);
  if (env.LLM_PROVIDER === "fake") bad("LLM_PROVIDER 가 fake 입니다.");
  else if (env.LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY) add("warn", "OPENAI_API_KEY 가 비어 있습니다. 서버 키로 AI를 쓰는 기능이 있다면 동작하지 않습니다 (웰컴 페이지 체험은 사용자 키를 씁니다).");
  if (["memory", ""].includes(env.STORAGE_BACKEND ?? "")) bad(`STORAGE_BACKEND 가 ${env.STORAGE_BACKEND ? `${env.STORAGE_BACKEND} 입니다` : "비어 있습니다"} (프로필 이미지 올리기가 동작하지 않거나 재시작하면 사라집니다).`);
  for (const key of ["CORS_ORIGINS", "FRONTEND_BASE_URL", "SOCIAL_REDIRECT_BASE_URL", "DATABASE_URL"]) {
    if (env[key] && LOCAL.test(env[key])) bad(`${key} 가 로컬 주소입니다.`);
  }
  if (!out.some((r) => r.level === "error" || r.level === "warn")) add("ok", "문제가 될 만한 값이 없습니다.");
  return { results: out, hidden };
}

export async function runEnv(args) {
  const [sub, ...rest] = args;
  if (sub !== "check") {
    info(`사용법: ${cyan("npx @snackcup/meerkit env check [--prod]")}`);
    return sub ? 1 : 0;
  }
  const dirIdx = rest.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? rest[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  const file = join(root, "backend", ".env");
  if (!existsSync(file)) {
    fail("backend/.env 가 없습니다. 먼저 npx @snackcup/meerkit setup 을 실행하세요.");
    return 1;
  }
  const prod = rest.includes("--prod");
  info(bold(`backend/.env 점검 ${prod ? "(운영 기준)" : "(로컬 기준: 깨진 설정만 봅니다)"}`));
  console.log(dim("값은 출력하지 않습니다.\n"));
  const { results, hidden } = checkEnv(parseEnv(await readFile(file, "utf8")), { prod });
  for (const r of results) (r.level === "ok" ? ok : r.level === "warn" ? warn : fail)(r.text);
  const errors = results.filter((r) => r.level === "error").length;
  console.log("");
  if (errors) fail(bold(`고쳐야 할 항목 ${errors}개`));
  else ok(bold(prod ? "운영 점검 통과" : "로컬 기준 문제 없음"));
  if (!prod) info(dim(`운영 기준으로는 ${hidden}개 항목이 걸립니다(로컬 개발에서는 정상). 배포 전에 ${cyan("npx @snackcup/meerkit env check --prod")} 로 확인하세요.`));
  return errors ? 1 : 0;
}
