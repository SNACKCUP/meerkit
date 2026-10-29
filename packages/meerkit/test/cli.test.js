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
