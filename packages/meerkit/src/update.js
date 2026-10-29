import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";

import { kitVersion, readManifest, render, sha, templateFiles, templateHashes, writeManifest } from "./manifest.js";
import { findProjectRoot } from "./setup.js";
import { TEMPLATE_DIR } from "./paths.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

// 바뀌면 설치를 다시 해야 하는 파일
const INSTALL_FILES = new Set(["frontend/package.json", "frontend/package-lock.json", "backend/pyproject.toml", "backend/uv.lock"]);
const NEW_SUFFIX = ".meerkit-new";

/**
 * 프로젝트와 새 템플릿을 비교해 파일마다 할 일을 정한다. 아무것도 쓰지 않는다.
 * base = 받았을 때 기록(없으면 null), cur = 지금 프로젝트 파일, next = 새 템플릿
 *  add 새 파일 / update 안 고친 파일이라 덮어씀 / conflict 둘 다 바뀜 → .meerkit-new / keep 내가 고친 파일, 킷은 그대로 / same 이미 같음
 *  removed 킷에서 사라진 파일(지우지 않음) / deleted 내가 지운 파일(되살리지 않음)
 */
export async function planUpdate(root, { templateDir = TEMPLATE_DIR, manifest = null } = {}) {
  const name = existsSync(join(root, "frontend", "package.json"))
    ? JSON.parse(await readFile(join(root, "frontend", "package.json"), "utf8")).name || basename(root)
    : basename(root);
  const base = manifest?.files ?? null;
  const entries = [];
  const nextFiles = {};
  for (const [rel, abs] of await templateFiles(templateDir)) {
    const nextBuf = render(rel, await readFile(abs), name);
    const next = sha(nextBuf);
    nextFiles[rel] = next;
    const curPath = join(root, rel);
    const cur = existsSync(curPath) ? sha(await readFile(curPath)) : null;
    const b = base?.[rel] ?? null;
    let action;
    if (cur === null) action = b === null ? "add" : b === next ? "same" : "deleted";
    else if (cur === next) action = "same";
    else if (b !== null && cur === b) action = "update";
    else if (b !== null && b === next) action = "keep";
    else action = "conflict";
    entries.push({ rel, action, content: nextBuf });
  }
  if (base) for (const rel of Object.keys(base)) if (!(rel in nextFiles)) entries.push({ rel, action: "removed" });
  return { entries, nextFiles };
}

/** 계획대로 파일을 쓴다. 충돌 파일은 원본 옆에 .meerkit-new 로 둔다. */
export async function applyUpdate(root, plan, version) {
  const written = [];
  for (const { rel, action, content } of plan.entries) {
    if (action !== "add" && action !== "update" && action !== "conflict") continue;
    const target = join(root, action === "conflict" ? rel + NEW_SUFFIX : rel);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    written.push(target);
  }
  await writeManifest(root, version, plan.nextFiles);
  return written;
}

const LABEL = {
  update: "갱신",
  add: "추가",
  conflict: "충돌 (직접 합치기)",
  keep: "내가 고친 파일 (유지)",
  removed: "킷에서 사라짐 (지우지 않음)",
  deleted: "내가 지운 파일 (유지)",
};

function gitState(root) {
  const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
  const inside = git(["rev-parse", "--show-toplevel"]);
  // 프로젝트가 더 큰 저장소의 일부일 수 있어, 프로젝트 폴더 안의 변경만 본다
  if (inside.status !== 0) return "none";
  const status = git(["status", "--porcelain", "--", "."]);
  return status.status === 0 && status.stdout.trim() ? "dirty" : "clean";
}

export async function runUpdate(args) {
  const dirIdx = args.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? args[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  const apply = args.includes("--apply");
  const force = args.includes("--force");
  const version = await kitVersion();
  const manifest = await readManifest(root);
  const plan = await planUpdate(root, { manifest });

  info(bold(`Meerkit 업데이트 ${dim(`(${manifest ? `${manifest.kitVersion} → ` : "받은 버전을 알 수 없음 → "}${version})`)}`));
  if (!manifest) {
    warn("이 프로젝트에는 받은 버전 기록(.meerkit/manifest.json)이 없습니다. 지금 파일과 새 버전이 다른 곳은 모두 '충돌'로 보고, 원본은 건드리지 않습니다.");
  }

  const shown = ["update", "add", "conflict", "removed"];
  const counts = {};
  for (const e of plan.entries) counts[e.action] = (counts[e.action] ?? 0) + 1;
  for (const action of shown) {
    const list = plan.entries.filter((e) => e.action === action);
    if (!list.length) continue;
    info(`\n${bold(LABEL[action])} ${dim(`${list.length}개`)}`);
    for (const e of list.slice(0, 40)) info(`  ${e.rel}`);
    if (list.length > 40) info(dim(`  … 외 ${list.length - 40}개`));
  }
  const kept = (counts.keep ?? 0) + (counts.deleted ?? 0);
  if (kept) info(`\n${dim(`내가 고치거나 지운 파일 ${kept}개는 그대로 둡니다.`)}`);

  const changes = (counts.update ?? 0) + (counts.add ?? 0) + (counts.conflict ?? 0);
  if (!changes && manifest?.kitVersion === version) {
    ok("이미 최신입니다.");
    return 0;
  }
  if (!changes) {
    info("");
    ok("바뀔 파일이 없습니다.");
    if (apply) await writeManifest(root, version, plan.nextFiles);
    return 0;
  }

  if (!apply) {
    info(`\n여기까지는 미리보기입니다. 아무것도 바꾸지 않았습니다.`);
    info(`  실제로 적용하려면 ${cyan("npx @snackcup/meerkit@latest update --apply")}`);
    return 0;
  }

  const git = gitState(root);
  if (git === "dirty" && !force) {
    fail("커밋하지 않은 변경이 있습니다. 먼저 커밋하거나 stash 한 뒤 다시 실행하세요. (되돌리기 쉽게 하려는 것입니다. 무시하려면 --force)");
    return 1;
  }
  if (git === "none") warn("git 저장소가 아니라서 변경을 되돌리기 어렵습니다. 먼저 백업해 두세요.");

  const written = await applyUpdate(root, plan, version);
  info("");
  ok(`${written.length}개 파일을 썼습니다. 받은 버전 기록을 ${version}으로 갱신했습니다.`);
  const conflicts = plan.entries.filter((e) => e.action === "conflict");
  if (conflicts.length) {
    warn(`충돌 ${conflicts.length}개는 원본 옆에 *${NEW_SUFFIX} 로 새 버전을 두었습니다. 내용을 비교해 직접 합친 뒤 ${NEW_SUFFIX} 파일을 지우세요.`);
    info(dim(`  비교: git diff --no-index <파일> <파일>${NEW_SUFFIX}`));
  }
  if (plan.entries.some((e) => (e.action === "update" || e.action === "add") && INSTALL_FILES.has(e.rel))) {
    warn(`의존성 파일이 바뀌었습니다. ${cyan("npx @snackcup/meerkit setup")} 으로 다시 설치하세요.`);
  }
  info(dim("마이그레이션이 추가됐을 수 있으니 db migrate 도 실행해 보세요: npx @snackcup/meerkit db migrate"));
  return 0;
}
