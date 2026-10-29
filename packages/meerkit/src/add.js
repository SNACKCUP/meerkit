import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { findProjectRoot } from "./setup.js";
import { bold, cyan, dim, fail, info, ok, warn } from "./ui.js";

// 킷 패키지·파이썬 예약어와 겹치는 이름은 쓰지 않는다
const RESERVED = new Set(["app", "core", "users", "auth", "permissions", "account", "social", "codes", "llm", "mail", "storage", "features", "test", "tests", "admin", "api"]);

export function validateFeatureName(name) {
  if (!name) return "기능 이름을 입력해 주세요. 예: meetings";
  if (!/^[a-z][a-z0-9_]{1,30}$/.test(name)) return `쓸 수 없는 이름입니다: ${name}  (소문자로 시작, 소문자·숫자·_ 만, 2~31자)`;
  if (RESERVED.has(name)) return `예약된 이름입니다: ${name}`;
  return null;
}

const pascal = (n) => n.split("_").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const titleOf = (n) => n.split("_").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");

/** 만들 파일 목록 { 경로: 내용 }. 경로는 프로젝트 루트 기준. */
export function featureFiles(name) {
  const P = pascal(name);
  const url = name.replaceAll("_", "-");
  return {
    [`backend/app/features/${name}/__init__.py`]: `"""${titleOf(name)} 기능. router → service → repository 방향으로만 import 합니다 (SQL은 repository에만)."""\n`,
    [`backend/app/features/${name}/schemas.py`]: `from pydantic import BaseModel, ConfigDict


class ${P}Read(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
`,
    [`backend/app/features/${name}/repository.py`]: `"""DB 접근. SQL은 여기에만 둡니다. 테이블이 생기면 models.py를 만들고 Alembic 마이그레이션을 추가하세요."""

from sqlalchemy.orm import Session


def list_all(db: Session) -> list:
    # TODO: models.py를 만든 뒤 db.scalars(select(...)).all() 로 바꾸세요
    return []
`,
    [`backend/app/features/${name}/service.py`]: `from sqlalchemy.orm import Session

from app.features.${name} import repository
from app.users.models import User


def list_items(db: Session, user: User) -> list:
    return repository.list_all(db)
`,
    [`backend/app/features/${name}/router.py`]: `from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.features.${name} import service
from app.features.${name}.schemas import ${P}Read
from app.users.models import User

router = APIRouter(prefix="/${url}", tags=["${url}"])


@router.get("", response_model=list[${P}Read], summary="${titleOf(name)} 목록 (로그인 필요)")
def list_items(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.list_items(db, user)
`,
    [`backend/tests/features/${name}/test_${name}.py`]: `"""${titleOf(name)}: 로그인이 필요하고, 로그인하면 목록을 받는다"""


def test_requires_login(client):
    assert client.get("/api/${url}").status_code == 401


def test_list_for_logged_in_user(client, make_user, login):
    make_user("tester01")
    response = client.get("/api/${url}", headers=login("tester01"))
    assert response.status_code == 200
    assert response.json() == []
`,
    [`frontend/src/app/(service)/${url}/page.tsx`]: `export default function ${P}Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">${titleOf(name)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">백엔드 GET /api/${url} 를 TanStack Query로 불러와 이 화면을 채우세요.</p>
    </main>
  );
}
`,
  };
}

/** backend/app/api.py 에 import와 include_router 를 넣는다. 모양이 달라서 못 넣으면 false. */
export function registerInApi(text, name) {
  const importLine = `from app.features.${name}.router import router as ${name}_router`;
  const includeLine = `api_router.include_router(${name}_router)`;
  if (text.includes(importLine)) return text;
  const lines = text.split("\n");
  const lastImport = lines.map((l, i) => (/^(from|import) /.test(l) ? i : -1)).filter((i) => i >= 0).pop();
  const lastInclude = lines.map((l, i) => (l.startsWith("api_router.include_router(") ? i : -1)).filter((i) => i >= 0).pop();
  if (lastImport === undefined || lastInclude === undefined) return null;
  const featureImports = lines.map((l, i) => (l.startsWith("from app.features.") ? i : -1)).filter((i) => i >= 0);
  const importAt = featureImports.length ? featureImports.pop() : lastImport;
  lines.splice(lastInclude + 1, 0, includeLine);
  lines.splice(importAt + 1, 0, importLine);
  return lines.join("\n");
}

export async function runAdd(args) {
  const [kind, name, ...rest] = args;
  if (kind !== "feature") {
    info(`사용법: ${cyan("npx @snackcup/meerkit add feature <이름>")}   예: add feature meetings`);
    return kind ? 1 : 0;
  }
  const bad = validateFeatureName(name);
  if (bad) {
    fail(bad);
    return 1;
  }
  const dirIdx = rest.indexOf("--dir");
  const root = findProjectRoot(dirIdx >= 0 ? rest[dirIdx + 1] : process.cwd());
  if (!root) {
    fail("Meerkit 프로젝트 폴더에서 실행해 주세요. (docker-compose.yml, frontend, backend가 있는 폴더)");
    return 1;
  }
  const files = featureFiles(name);
  const clash = Object.keys(files).filter((f) => existsSync(join(root, f)));
  if (clash.length) {
    fail(`이미 있는 파일이 있어 만들지 않았습니다:\n  ${clash.join("\n  ")}`);
    return 1;
  }
  if (rest.includes("--dry-run")) {
    info(bold("만들 파일 (--dry-run, 실제로 만들지 않았습니다):"));
    for (const f of Object.keys(files)) info(`  ${f}`);
    return 0;
  }

  for (const [f, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, f)), { recursive: true });
    await writeFile(join(root, f), content);
  }
  const apiPath = join(root, "backend", "app", "api.py");
  let registered = false;
  if (existsSync(apiPath)) {
    const next = registerInApi(await readFile(apiPath, "utf8"), name);
    if (next) {
      await writeFile(apiPath, next);
      registered = true;
    }
  }

  ok(bold(`'${name}' 기능을 만들었습니다.`));
  for (const f of Object.keys(files)) info(`  ${dim("+")} ${f}`);
  if (registered) info(`  ${dim("~")} backend/app/api.py (라우터 등록)`);
  else warn(`backend/app/api.py 를 자동으로 고치지 못했습니다. 직접 추가하세요:\n    from app.features.${name}.router import router as ${name}_router\n    api_router.include_router(${name}_router)`);
  const url = name.replaceAll("_", "-");
  info(`\n다음 순서\n  1. 서버를 다시 켜고 http://localhost:8000/docs 에서 /${url} 확인, 화면은 http://localhost:3000/${url}\n  2. 테이블이 필요하면 models.py를 만들고 ${cyan("uv run alembic revision --autogenerate -m \"...\"")} (backend 폴더)\n  3. ${cyan("npx @snackcup/meerkit test")} 로 확인`);
  return 0;
}
