import { cp, mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { kitVersion, templateHashes, writeManifest } from "./manifest.js";
import { TEMPLATE_DIR } from "./paths.js";
import { bold, cyan, fail, info, ok } from "./ui.js";

// npm 패키지에서는 .gitignore가 빠지므로 템플릿에는 _gitignore로 들어 있다. 만든 뒤 원래 이름으로 돌려놓는다.
export async function restoreGitignores(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await restoreGitignores(full);
    else if (entry.name === "_gitignore") await rename(full, join(dir, ".gitignore"));
  }
}

// 폴더 이름은 소문자, 숫자, -, _ 만 허용 (npm 패키지 이름으로 쓸 수 있는 모양)
export function validateProjectName(name) {
  if (!name) return "프로젝트 이름을 입력해 주세요. 예: npx create-meerkit my-app";
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) return `"${name}"은(는) 쓸 수 없는 이름입니다. 소문자, 숫자, -, _ 만 쓸 수 있고 문자나 숫자로 시작해야 합니다.`;
  return null;
}

async function isEmptyDir(dir) {
  const entries = await readdir(dir);
  return entries.length === 0;
}

/** 템플릿을 target 폴더에 펼친다. 성공하면 만든 절대 경로를 돌려준다. */
export async function createProject(target, { templateDir = TEMPLATE_DIR } = {}) {
  const dest = resolve(target);
  const name = basename(dest);
  const problem = validateProjectName(name);
  if (problem) throw new Error(problem);
  if (!existsSync(templateDir)) throw new Error("템플릿을 찾을 수 없습니다. 패키지가 올바르게 설치되었는지 확인해 주세요.");

  if (existsSync(dest)) {
    const st = await stat(dest);
    if (!st.isDirectory()) throw new Error(`"${target}"은(는) 이미 있는 파일입니다.`);
    if (!(await isEmptyDir(dest))) throw new Error(`"${target}" 폴더가 비어 있지 않습니다. 다른 이름을 쓰거나 빈 폴더를 지정해 주세요.`);
  } else {
    await mkdir(dest, { recursive: true });
  }

  await cp(templateDir, dest, { recursive: true });
  await restoreGitignores(dest);

  // 프론트 패키지 이름을 프로젝트 이름으로
  const pkgPath = join(dest, "frontend", "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    pkg.name = name;
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
  // 받은 버전과 파일별 해시를 적어 둔다 (나중에 update가 내가 고친 파일을 알아보는 기준)
  await writeManifest(dest, await kitVersion(), await templateHashes(name, templateDir));
  return dest;
}

export async function runInit(args) {
  const target = args.find((a) => !a.startsWith("-"));
  const problem = validateProjectName(target ? basename(resolve(target)) : "");
  if (problem) {
    fail(problem);
    return 1;
  }
  try {
    const dest = await createProject(target);
    ok(`${bold(basename(dest))} 프로젝트를 만들었습니다.`);
    info("");
    info("다음 순서로 진행하세요.");
    info(`  ${cyan(`cd ${target}`)}`);
    info(`  ${cyan("npx @snackcup/meerkit setup")}   ${"# 의존성 설치, DB, 관리자 계정까지 자동으로 세팅합니다"}`);
    return 0;
  } catch (e) {
    fail(e.message);
    return 1;
  }
}
