import { diagnose } from "../src/setup.js";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { checkDocker, checkNode, checkPorts, checkUv } from "../src/checks.js";
import { ensureEnvFiles } from "../src/env.js";
import { createProject, validateProjectName } from "../src/init.js";
import { findProjectRoot } from "../src/setup.js";
import { missingSetup } from "../src/start.js";

const tmp = () => mkdtemp(join(tmpdir(), "meerkit-test-"));

test("프로젝트 이름 검사", () => {
  assert.equal(validateProjectName("my-app"), null);
  assert.equal(validateProjectName("app_2"), null);
  assert.match(validateProjectName("My App"), /쓸 수 없는 이름/);
  assert.match(validateProjectName(""), /입력/);
});

test("Node 버전: 20 미만이면 설치 링크를 알려 준다", () => {
  assert.equal(checkNode("20.1.0").ok, true);
  const old = checkNode("18.19.0");
  assert.equal(old.ok, false);
  assert.match(old.url, /nodejs\.org/);
});

test("uv가 없으면 설치 링크를 알려 준다", () => {
  const r = checkUv(() => ({ ok: false, out: "", err: "" }));
  assert.equal(r.ok, false);
  assert.match(r.url, /astral\.sh/);
});

test("Docker: 없음 / 설치됐지만 꺼져 있음 / 정상", () => {
  const none = checkDocker(() => ({ ok: false, out: "", err: "" }));
  assert.equal(none.length, 1);
  assert.match(none[0].url, /docker\.com/);

  const off = checkDocker((cmd, args) => ({ ok: args[0] !== "info", out: "Docker version 27", err: "" }));
  assert.equal(off.find((r) => r.id === "docker-running").ok, false);
  assert.equal(off.find((r) => r.id === "docker").ok, true);

  const good = checkDocker(() => ({ ok: true, out: "ok", err: "" }));
  assert.ok(good.every((r) => r.ok));
});

test("포트가 쓰이는 중이면 알려 준다", async () => {
  const r = await checkPorts([{ port: 3000, name: "프론트" }], async () => false);
  assert.equal(r[0].ok, false);
  assert.match(r[0].fix, /3000/);
});

test("환경 변수: 비밀키를 만들고, 다시 실행해도 값을 바꾸지 않는다", async () => {
  const root = await tmp();
  await mkdir(join(root, "backend"));
  await mkdir(join(root, "frontend"));
  await writeFile(join(root, "backend", ".env.example"), "A=1\nJWT_SECRET_KEY=change-me-to-a-random-string\nSEED_ADMIN_PASSWORD=meerkit-local-admin\nB=2\n");
  await writeFile(join(root, "frontend", ".env.example"), "X=1\n");

  const first = await ensureEnvFiles(root);
  assert.ok(first.includes("backend/.env") && first.includes("frontend/.env.local"));
  const env1 = await readFile(join(root, "backend", ".env"), "utf8");
  const key = env1.match(/^JWT_SECRET_KEY=(.+)$/m)[1];
  assert.ok(key.length >= 32 && !key.startsWith("change-me"));
  const pw = env1.match(/^SEED_ADMIN_PASSWORD=(.+)$/m)[1];
  assert.ok(pw.length >= 12 && pw !== "meerkit-local-admin", "관리자 비밀번호는 새로 만든 값이어야 합니다");
  assert.match(env1, /^A=1$/m); // 다른 값은 그대로

  const second = await ensureEnvFiles(root);
  assert.deepEqual(second, []);
  assert.equal(await readFile(join(root, "backend", ".env"), "utf8"), env1);
});

test("setup은 프로젝트 폴더가 아니면 찾지 못한다", async () => {
  assert.equal(findProjectRoot(await tmp()), null);
});

test("템플릿으로 프로젝트 만들기: 구조, .gitignore 복원, 서브 프로젝트 없음", async (t) => {
  const template = new URL("../template", import.meta.url).pathname;
  if (!existsSync(template)) return t.skip("npm run sync-template 먼저 실행하세요");
  const dest = join(await tmp(), "my-app");
  await createProject(dest);
  for (const f of ["frontend/package.json", "backend/pyproject.toml", "docker-compose.yml", "README.md", ".gitignore"]) {
    assert.ok(existsSync(join(dest, f)), `${f} 없음`);
  }
  assert.ok(!existsSync(join(dest, "docs")));
  assert.ok(!existsSync(join(dest, "CLAUDE.md")));
  assert.ok(!existsSync(join(dest, "backend", "app", "features", "requirements")));
  assert.ok(!existsSync(join(dest, "frontend", "src", "app", "(sub)")));
  assert.ok(!existsSync(join(dest, "frontend", "src", "meerkit", "docs")), "설명서 코드가 템플릿에 있으면 안 됩니다");
  assert.ok(!existsSync(join(dest, "frontend", "src", "app", "(meerkit)", "docs")));
  const pkg = JSON.parse(await readFile(join(dest, "frontend", "package.json"), "utf8"));
  assert.equal(pkg.name, "my-app");
  await assert.rejects(createProject(dest), /비어 있지 않습니다/);
});

test("diagnose: 로그에서 흔한 원인을 알아본다", () => {
  assert.match(diagnose(["Cannot connect to the Docker daemon"]).join(), /Docker Desktop/);
  assert.match(diagnose(["Bind for 0.0.0.0:5432 failed: port is already allocated"]).join(), /포트/);
  assert.match(diagnose(["getaddrinfo ENOTFOUND registry.npmjs.org"]).join(), /네트워크/);
  assert.deepEqual(diagnose(["알 수 없는 오류"]), []);
  assert.deepEqual(diagnose(), []);
});

test("포트 점검: 쓰고 있는 프로그램을 알려 준다", async () => {
  const [r] = await checkPorts([{ port: 8000, name: "백엔드" }], async () => false, () => "python3 (PID 4242)");
  assert.equal(r.ok, false);
  assert.match(r.detail, /python3 \(PID 4242\)/);
  const [free] = await checkPorts([{ port: 8000, name: "백엔드" }], async () => true);
  assert.equal(free.ok, true);
});

test("start: 세팅이 안 끝난 프로젝트는 빠진 것을 알려 준다", async () => {
  const dir = await tmp();
  assert.equal(missingSetup(dir).length, 3);
  await mkdir(join(dir, "backend"), { recursive: true });
  await writeFile(join(dir, "backend", ".env"), "A=1\n");
  await mkdir(join(dir, "backend", ".venv"));
  await mkdir(join(dir, "frontend", "node_modules"), { recursive: true });
  assert.deepEqual(missingSetup(dir), []);
});

import { featureFiles, registerInApi, validateFeatureName } from "../src/add.js";
import { main } from "../src/cli.js";
import { databaseTarget } from "../src/db.js";
import { checkEnv, parseEnv } from "../src/envcheck.js";
import { COMMANDS, helpAll, helpOf } from "../src/help.js";

test("도움말: 모든 명령에 설명이 있고, 목록에 모두 나온다", () => {
  const all = helpAll();
  for (const c of COMMANDS) {
    assert.match(all, new RegExp(`\\b${c.name}\\b`));
    assert.match(helpOf(c.name), /사용법/);
  }
  assert.equal(helpOf("없는명령"), null);
});

test("cli: <명령> --help 는 명령을 실행하지 않고 도움말만 보여 준다", async () => {
  assert.equal(await main(["stop", "--help"]), 0);
  assert.equal(await main(["help", "db"]), 0);
  assert.equal(await main(["help", "없는명령"]), 1);
  assert.equal(await main(["없는명령"]), 1);
});

test("add: 기능 이름 검사", () => {
  assert.equal(validateFeatureName("meetings"), null);
  assert.equal(validateFeatureName("meeting_notes"), null);
  assert.match(validateFeatureName("Meetings"), /쓸 수 없는/);
  assert.match(validateFeatureName("1abc"), /쓸 수 없는/);
  assert.match(validateFeatureName("auth"), /예약/);
  assert.match(validateFeatureName(""), /입력/);
});

test("add: 만들 파일 경로와 URL 이름", () => {
  const files = featureFiles("meeting_notes");
  assert.ok("backend/app/features/meeting_notes/router.py" in files);
  assert.ok("frontend/src/app/(service)/meeting-notes/page.tsx" in files);
  assert.match(files["backend/app/features/meeting_notes/router.py"], /prefix="\/meeting-notes"/);
  assert.match(files["backend/app/features/meeting_notes/schemas.py"], /class MeetingNotesRead/);
});

test("add: api.py에 import와 include_router를 넣고, 다시 넣어도 중복되지 않는다", () => {
  const api = `from fastapi import APIRouter

from app.features.llm_demo.router import router as llm_demo_router
from app.social.router import router as social_router

api_router = APIRouter()

# 서비스 기능
api_router.include_router(llm_demo_router)
`;
  const once = registerInApi(api, "meetings");
  assert.match(once, /from app\.features\.meetings\.router import router as meetings_router/);
  assert.ok(once.trimEnd().endsWith("api_router.include_router(meetings_router)"));
  assert.ok(once.indexOf("meetings.router") > once.indexOf("llm_demo.router"));
  assert.ok(once.indexOf("meetings.router") < once.indexOf("social.router"));
  assert.equal(registerInApi(once, "meetings"), once);
  assert.equal(registerInApi("print('모양이 다름')", "meetings"), null);
});

test("env: 예시 값 그대로의 비밀키는 항상 오류, 운영 기준은 로컬 설정을 오류로 본다", () => {
  const env = parseEnv("# 주석\nJWT_SECRET_KEY=change-me-to-a-random-string\nAPP_ENV=local\nCORS_ORIGINS=\"http://localhost:3000\"\nMAIL_BACKEND=console\n");
  assert.equal(env.CORS_ORIGINS, "http://localhost:3000");
  const local = checkEnv(env);
  assert.ok(local.results.some((r) => r.level === "error" && /JWT_SECRET_KEY/.test(r.text)));
  assert.ok(local.hidden > 0);
  assert.ok(!local.results.some((r) => /APP_ENV/.test(r.text)));
  const prod = checkEnv(env, { prod: true });
  assert.ok(prod.results.some((r) => r.level === "error" && /APP_ENV/.test(r.text)));
  const good = checkEnv(parseEnv(`JWT_SECRET_KEY=${"a".repeat(48)}\n`));
  assert.ok(good.results.some((r) => r.level === "ok" && /JWT_SECRET_KEY/.test(r.text)));
  // 값은 결과 문장에 들어가지 않는다
  assert.ok(!JSON.stringify(good).includes("aaaaaaaaaa"));
});

test("db: DATABASE_URL에서 호스트·포트를 읽고 로컬인지 알려 준다", async () => {
  const dir = await tmp();
  await mkdir(join(dir, "backend"), { recursive: true });
  await writeFile(join(dir, "backend", ".env"), "DATABASE_URL=postgresql+psycopg://starter:pw@localhost:5432/starter\n");
  assert.deepEqual(await databaseTarget(dir), { host: "localhost", port: 5432, local: true });
  await writeFile(join(dir, "backend", ".env"), "DATABASE_URL=postgresql+psycopg://u:p@db.example.com:6543/postgres\n");
  const remote = await databaseTarget(dir);
  assert.equal(remote.local, false);
  assert.equal(remote.port, 6543);
  assert.equal(await databaseTarget(await tmp()), null);
});

test("update: 만든 프로젝트는 manifest가 있고 바로 업데이트하면 바뀔 것이 없다", async () => {
  const { planUpdate } = await import("../src/update.js");
  const { readManifest } = await import("../src/manifest.js");
  const tpl = await tmp();
  await mkdir(join(tpl, "frontend"), { recursive: true });
  await mkdir(join(tpl, "backend"));
  await writeFile(join(tpl, "frontend", "package.json"), JSON.stringify({ name: "meerkit" }));
  await writeFile(join(tpl, "frontend", "a.txt"), "A1");
  await writeFile(join(tpl, "backend", "b.txt"), "B1");
  await writeFile(join(tpl, "docker-compose.yml"), "x");
  await writeFile(join(tpl, "_gitignore"), "node_modules");
  const root = join(await tmp(), "my-app");
  await createProject(root, { templateDir: tpl });
  const manifest = await readManifest(root);
  assert.ok(manifest.files["frontend/a.txt"]);
  assert.ok(manifest.files[".gitignore"]);
  const plan = await planUpdate(root, { templateDir: tpl, manifest });
  assert.ok(plan.entries.every((e) => e.action === "same"), JSON.stringify(plan.entries.map((e) => [e.rel, e.action])));
});

test("update: 안 고친 파일은 갱신, 고친 파일은 유지, 둘 다 바뀌면 충돌, 새 파일은 추가", async () => {
  const { planUpdate, applyUpdate } = await import("../src/update.js");
  const { readManifest } = await import("../src/manifest.js");
  const tpl = await tmp();
  await mkdir(join(tpl, "frontend"));
  await mkdir(join(tpl, "backend"));
  await writeFile(join(tpl, "frontend", "package.json"), JSON.stringify({ name: "meerkit" }));
  for (const f of ["untouched", "edited", "both", "deleted", "gone"]) await writeFile(join(tpl, "backend", f), "v1");
  await writeFile(join(tpl, "docker-compose.yml"), "x");
  const root = join(await tmp(), "my-app");
  await createProject(root, { templateDir: tpl });
  const manifest = await readManifest(root);

  // 사용자가 고친 것
  await writeFile(join(root, "backend", "edited"), "mine");
  await writeFile(join(root, "backend", "both"), "mine");
  const { rm } = await import("node:fs/promises");
  await rm(join(root, "backend", "deleted"));
  // 킷이 새 버전을 낸 것
  await writeFile(join(tpl, "backend", "untouched"), "v2");
  await writeFile(join(tpl, "backend", "both"), "v2");
  await writeFile(join(tpl, "backend", "new"), "v2");
  await writeFile(join(tpl, "backend", "deleted"), "v2");
  await rm(join(tpl, "backend", "gone"));

  const plan = await planUpdate(root, { templateDir: tpl, manifest });
  const act = Object.fromEntries(plan.entries.map((e) => [e.rel, e.action]));
  assert.equal(act["backend/untouched"], "update");
  assert.equal(act["backend/edited"], "keep");
  assert.equal(act["backend/both"], "conflict");
  assert.equal(act["backend/new"], "add");
  assert.equal(act["backend/deleted"], "deleted");
  assert.equal(act["backend/gone"], "removed");
  assert.equal(act["docker-compose.yml"], "same");
  assert.equal(act["frontend/package.json"], "same"); // 프로젝트 이름은 비교에서 제외된다

  await applyUpdate(root, plan, "9.9.9");
  assert.equal(await readFile(join(root, "backend", "untouched"), "utf8"), "v2");
  assert.equal(await readFile(join(root, "backend", "edited"), "utf8"), "mine");
  assert.equal(await readFile(join(root, "backend", "both"), "utf8"), "mine");
  assert.equal(await readFile(join(root, "backend", "both.meerkit-new"), "utf8"), "v2");
  assert.equal(await readFile(join(root, "backend", "new"), "utf8"), "v2");
  assert.equal(existsSync(join(root, "backend", "deleted")), false);
  assert.equal((await readManifest(root)).kitVersion, "9.9.9");

  // 적용 후 다시 실행하면 내가 고친 파일은 유지, 충돌 파일도 다시 덮이지 않는다
  const again = await planUpdate(root, { templateDir: tpl, manifest: await readManifest(root) });
  const act2 = Object.fromEntries(again.entries.map((e) => [e.rel, e.action]));
  assert.equal(act2["backend/both"], "keep");
  assert.equal(act2["backend/untouched"], "same");
});

test("update: 기록이 없으면 다른 파일은 충돌, 같은 파일은 그대로", async () => {
  const { planUpdate } = await import("../src/update.js");
  const tpl = await tmp();
  await mkdir(join(tpl, "frontend"));
  await mkdir(join(tpl, "backend"));
  await writeFile(join(tpl, "frontend", "package.json"), JSON.stringify({ name: "meerkit" }));
  await writeFile(join(tpl, "backend", "same"), "v1");
  await writeFile(join(tpl, "backend", "diff"), "v1");
  await writeFile(join(tpl, "docker-compose.yml"), "x");
  const root = join(await tmp(), "my-app");
  await createProject(root, { templateDir: tpl });
  await writeFile(join(root, "backend", "diff"), "other");
  const plan = await planUpdate(root, { templateDir: tpl, manifest: null });
  const act = Object.fromEntries(plan.entries.map((e) => [e.rel, e.action]));
  assert.equal(act["backend/same"], "same");
  assert.equal(act["backend/diff"], "conflict");
});

test("start --port: 포트 옵션 읽기와 검사", async () => {
  const { parsePorts } = await import("../src/ports.js");
  assert.deepEqual(parsePorts([]).ports, { web: 3000, api: 8000 });
  assert.deepEqual(parsePorts(["--port", "3100", "--api-port", "8100"]).ports, { web: 3100, api: 8100 });
  assert.deepEqual(parsePorts(["--port", "4000"]).ports, { web: 4000, api: 8000 });
  assert.match(parsePorts(["--port", "abc"]).error, /--port/);
  assert.match(parsePorts(["--api-port", "80"]).error, /1024/);
  assert.match(parsePorts(["--port"]).error, /없음/);
  assert.match(parsePorts(["--port", "9000", "--api-port", "9000"]).error, /같을 수 없/);
});

test("update: 설치가 다시 쓰는 lock 파일은 비교하지 않는다", async () => {
  const { planUpdate } = await import("../src/update.js");
  const { readManifest } = await import("../src/manifest.js");
  const tpl = await tmp();
  await mkdir(join(tpl, "frontend"));
  await mkdir(join(tpl, "backend"));
  await writeFile(join(tpl, "frontend", "package.json"), JSON.stringify({ name: "meerkit" }));
  await writeFile(join(tpl, "frontend", "package-lock.json"), "lock1");
  await writeFile(join(tpl, "backend", "uv.lock"), "lock1");
  await writeFile(join(tpl, "docker-compose.yml"), "x");
  const root = join(await tmp(), "my-app");
  await createProject(root, { templateDir: tpl });
  await writeFile(join(root, "frontend", "package-lock.json"), "rewritten by npm install");
  await writeFile(join(tpl, "backend", "uv.lock"), "lock2");
  const plan = await planUpdate(root, { templateDir: tpl, manifest: await readManifest(root) });
  assert.ok(!plan.entries.some((e) => e.rel.endsWith("package-lock.json") || e.rel.endsWith("uv.lock")));
  assert.ok(plan.entries.every((e) => e.action === "same"));
});

test("test: 힌트는 그 원인으로 보일 때만 붙는다", async () => {
  const { shouldHint } = await import("../src/verify.js");
  const step = { hintWhen: /OperationalError|connection refused/i };
  assert.equal(shouldHint(step, ["E   AssertionError: 일부러 실패"]), false);
  assert.equal(shouldHint(step, ["sqlalchemy.exc.OperationalError: connection refused"]), true);
  assert.equal(shouldHint({}, ["아무 출력"]), true); // 조건이 없는 단계는 항상 보여 준다
});

test("update: 줄바꿈이 CRLF로 바뀌어도 고친 파일로 보지 않는다 (Windows git autocrlf)", async () => {
  const { sha } = await import("../src/manifest.js");
  const { planUpdate } = await import("../src/update.js");
  const { readManifest } = await import("../src/manifest.js");
  assert.equal(sha(Buffer.from("a\nb\n")), sha(Buffer.from("a\r\nb\r\n")));
  assert.notEqual(sha(Buffer.from("a\nb\n")), sha(Buffer.from("a\nc\n")));
  // 바이너리는 그대로 계산한다
  assert.notEqual(sha(Buffer.from([0, 1, 13, 10, 2])), sha(Buffer.from([0, 1, 10, 2])));

  const tpl = await tmp();
  await mkdir(join(tpl, "frontend"));
  await mkdir(join(tpl, "backend"));
  await writeFile(join(tpl, "frontend", "package.json"), JSON.stringify({ name: "meerkit" }));
  await writeFile(join(tpl, "backend", "a.py"), "x = 1\ny = 2\n");
  await writeFile(join(tpl, "docker-compose.yml"), "x");
  const root = join(await tmp(), "my-app");
  await createProject(root, { templateDir: tpl });
  await writeFile(join(root, "backend", "a.py"), "x = 1\r\ny = 2\r\n"); // 체크아웃이 CRLF로 바꾼 상황
  await writeFile(join(tpl, "backend", "a.py"), "x = 1\ny = 3\n"); // 킷이 새 버전을 냄
  const plan = await planUpdate(root, { templateDir: tpl, manifest: await readManifest(root) });
  assert.equal(plan.entries.find((e) => e.rel === "backend/a.py").action, "update");
});

test("포트 점검: 모든 주소(::)에 붙은 프로그램도 사용 중으로 본다", async () => {
  const { isPortFree } = await import("../src/checks.js");
  const net = await import("node:net");
  const srv = net.createServer();
  await new Promise((r) => srv.listen(0, r)); // 주소를 안 주면 모든 주소에 붙는다 (next 와 같은 방식)
  const { port } = srv.address();
  assert.equal(await isPortFree(port), false);
  await new Promise((r) => srv.close(r));
  assert.equal(await isPortFree(port), true);
});

test("docker-compose.yml: DB에 헬스체크가 있다 (없으면 setup의 마이그레이션이 DB 초기화와 겹쳐 실패할 수 있다)", async () => {
  const compose = await readFile(join(import.meta.dirname, "..", "..", "..", "docker-compose.yml"), "utf8");
  assert.match(compose, /healthcheck:[\s\S]*pg_isready -h 127\.0\.0\.1/);
});

test("Docker: 켜져 있는데 응답이 없으면(타임아웃) 실행 중이 아님과 구분해 안내한다", () => {
  const run = (cmd, args) => (args[0] === "info" ? { ok: false, timedOut: true, out: "", err: "" } : { ok: true, out: "ok", err: "" });
  const r = checkDocker(run).find((x) => x.id === "docker-running");
  assert.equal(r.ok, false);
  assert.equal(r.detail, "응답이 없음");
  assert.match(r.fix, /디스크/);
  // 타임아웃이 아니면 기존 안내
  const off = checkDocker((cmd, args) => ({ ok: args[0] !== "info", out: "ok", err: "" })).find((x) => x.id === "docker-running");
  assert.equal(off.detail, "실행 중이 아님");
});

test("디스크 여유 공간: 2GB 미만이면 막고 원인을 알려 준다", async () => {
  const { checkDisk } = await import("../src/checks.js");
  const GB = 1024 ** 3;
  assert.equal(checkDisk(10 * GB).ok, true);
  assert.equal(checkDisk(2 * GB).ok, true);
  const low = checkDisk(0.2 * GB);
  assert.equal(low.ok, false);
  assert.match(low.detail, /0\.2GB/);
  assert.match(low.fix, /ENOSPC/);
  assert.equal(checkDisk(null).ok, true); // 못 구하면 통과
});
