import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

import { PACKAGE_JSON, TEMPLATE_DIR } from "./paths.js";

// 어떤 파일을 어떤 킷 버전에서 받았는지 적어 두는 파일. update가 "내가 고친 파일"을 알아보는 기준이다.
export const MANIFEST_FILE = join(".meerkit", "manifest.json");

export const sha = (buf) => createHash("sha256").update(buf).digest("hex");

export async function kitVersion() {
  return JSON.parse(await readFile(PACKAGE_JSON, "utf8")).version;
}

/** 템플릿 파일 목록. 키는 프로젝트 안의 경로(항상 /), 값은 템플릿 안의 실제 경로. _gitignore는 .gitignore로 본다. */
export async function templateFiles(templateDir = TEMPLATE_DIR) {
  const out = new Map();
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else {
        const rel = relative(templateDir, full).split(sep).join("/");
        out.set(rel.replace(/(^|\/)_gitignore$/, "$1.gitignore"), full);
      }
    }
  }
  await walk(templateDir);
  return out;
}

/** 프로젝트에 실제로 쓰이는 모양으로 바꾼다. 프론트 패키지 이름만 프로젝트 이름으로 바뀐다. */
export function render(rel, buf, name) {
  if (rel !== "frontend/package.json") return buf;
  const pkg = JSON.parse(buf.toString("utf8"));
  pkg.name = name;
  return Buffer.from(JSON.stringify(pkg, null, 2) + "\n");
}

/** 템플릿 전체의 { 경로: 해시 } */
export async function templateHashes(name, templateDir = TEMPLATE_DIR) {
  const files = {};
  for (const [rel, abs] of await templateFiles(templateDir)) files[rel] = sha(render(rel, await readFile(abs), name));
  return files;
}

export async function readManifest(root) {
  const p = join(root, MANIFEST_FILE);
  if (!existsSync(p)) return null;
  try {
    const m = JSON.parse(await readFile(p, "utf8"));
    return m && typeof m.files === "object" ? m : null;
  } catch {
    return null;
  }
}

export async function writeManifest(root, version, files) {
  const p = join(root, MANIFEST_FILE);
  await mkdir(dirname(p), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(p, JSON.stringify({ kitVersion: version, files: sorted }, null, 2) + "\n");
}
