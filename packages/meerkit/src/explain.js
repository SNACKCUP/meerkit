const CMD = "npx @snackcup/meerkit";

/**
 * 실패 출력에서 원인을 알아낸다.
 * 알려진 원인이면 { summary, evidence, fixes } 를, 모르면 null 을 돌려준다.
 * summary: 무엇이 문제인지 한 줄, evidence: 출력에서 찾은 실제 에러 줄, fixes: 해결 순서.
 */

const clean = (line) => line.replace(/^E\s{2,}/, "").trim().slice(0, 200);

export function dbUnreachable(host, port, evidence = null) {
  return {
    summary: `DB(${host}:${port})에 연결하지 못했습니다`,
    evidence,
    fixes: [
      `DB가 켜져 있는지 확인: ${CMD} status`,
      `꺼져 있으면 켜기: ${CMD} start  (Docker Desktop이 실행 중이어야 합니다)`,
      `${port} 포트를 다른 프로그램이 쓰고 있으면 DB가 켜지지 않습니다. 쓰는 프로그램 확인: lsof -nP -iTCP:${port} -sTCP:LISTEN  (Windows: netstat -ano | findstr :${port})`,
      "backend/.env의 DATABASE_URL(테스트는 TEST_DATABASE_URL) 주소와 포트가 맞는지 확인",
    ],
  };
}

const find = (lines, re) => lines.find((l) => re.test(l));

export function explainFailure(lines) {
  const text = lines.join("\n");

  // DB에 연결하지 못함 (psycopg / SQLAlchemy)
  if (/connection to server at|Connection refused|could not connect to server|psycopg\.OperationalError|OperationalError.*connect/i.test(text)) {
    const at = text.match(/connection to server at "([^"]+)"(?:[^\n]*?port (\d+))?/i) ?? text.match(/host: '([^']+)', port: (\d+)/);
    const host = at?.[1] ?? "DB";
    const port = at?.[2] ?? text.match(/port (\d+)/i)?.[1] ?? "5432";
    return dbUnreachable(host, port, clean(find(lines, /connection (failed|to server)|Connection refused|could not connect/i) ?? lines.at(-1) ?? ""));
  }

  // 테이블이 없음 (마이그레이션 미적용)
  const rel = text.match(/relation "([^"]+)" does not exist|no such table: (\w+)/i);
  if (rel || /UndefinedTable/.test(text)) {
    const name = rel?.[1] ?? rel?.[2] ?? "";
    return {
      summary: `테이블${name ? ` '${name}'` : ""}이 없습니다. 마이그레이션이 적용되지 않았습니다`,
      evidence: clean(find(lines, /does not exist|no such table|UndefinedTable/i) ?? ""),
      fixes: [`마이그레이션 적용: ${CMD} db migrate`, `새 모델(models.py)을 만들었다면 먼저 마이그레이션을 만드세요: uv run alembic revision --autogenerate -m "설명"  (backend 폴더)`],
    };
  }

  // backend/.env 의 필수 값이 없음 (pydantic)
  const req = text.match(/^\s*([A-Za-z_][\w]*)\s*\n\s*Field required/m);
  if (req) {
    return {
      summary: `backend/.env에 필수 값이 없습니다: ${req[1].toUpperCase()}`,
      evidence: `${req[1]} Field required`,
      fixes: ["backend/.env.example과 비교해 빠진 줄을 backend/.env에 추가", `환경 설정 점검: ${CMD} env check`],
    };
  }

  // 파이썬 모듈을 찾지 못함
  const mod = text.match(/ModuleNotFoundError: No module named '([^']+)'/);
  if (mod) {
    const name = mod[1];
    return {
      summary: `파이썬 모듈 '${name}'을 찾지 못했습니다`,
      evidence: clean(find(lines, /ModuleNotFoundError/) ?? ""),
      fixes: [
        "내 코드의 import 이름(폴더·파일 이름)이 맞는지 확인",
        `라이브러리라면 backend 폴더에서 설치: uv add ${name.split(".")[0]}`,
        `설치가 중간에 끊겼다면 다시 설치: ${CMD} setup`,
      ],
    };
  }

  // 포트가 이미 사용 중
  const used = text.match(/EADDRINUSE[^\n]*?:(\d+)|address already in use[^\n]*?(\d{4,5})/i);
  if (used) {
    const port = used[1] ?? used[2];
    return {
      summary: `${port} 포트가 이미 사용 중입니다`,
      evidence: clean(find(lines, /EADDRINUSE|address already in use/i) ?? ""),
      fixes: [`이 프로젝트의 서버라면 끄기: ${CMD} stop`, `쓰는 프로그램 확인: lsof -nP -iTCP:${port} -sTCP:LISTEN  (Windows: netstat -ano | findstr :${port})`, "다른 포트로 실행: --port, --api-port 옵션"],
    };
  }

  return null;
}

/** 설명을 화면에 보여 줄 줄들로 만든다. */
export function formatExplanation(e) {
  const out = [`  원인: ${e.summary}`];
  if (e.evidence) out.push(`  에러: ${e.evidence}`);
  out.push("  해결:");
  e.fixes.forEach((f, i) => out.push(`    ${i + 1}. ${f}`));
  return out;
}
