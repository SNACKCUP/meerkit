# meerkit

Meerkit 스타터킷 CLI. 프로젝트를 만들고(`init`), 개발 환경을 한 번에 세팅합니다(`setup`).

```bash
npx create-meerkit my-app     # 또는 npx @snackcup/meerkit init my-app
cd my-app
npx @snackcup/meerkit setup
```

## 명령

| 명령 | 하는 일 |
| --- | --- |
| `meerkit init <폴더>` | 템플릿(frontend, backend, docker-compose.yml)을 펼칩니다. 폴더 이름은 소문자·숫자·`-`·`_` |
| `meerkit setup` | 프로젝트 폴더 안에서 실행. 환경 점검 → 설치 → `.env`와 비밀키 → DB → 마이그레이션 → 관리자 계정 → 서버 시작. `--no-start`는 서버를 켜지 않고 세팅만, `--port`·`--api-port`로 서버 포트 지정(`start`와 같음) |
| `meerkit start` | 세팅이 끝난 프로젝트의 서버만 켭니다: DB 확인 → 백엔드(8000) → 프론트엔드(3000). `--port`(프론트)·`--api-port`(백엔드)로 포트를 바꿀 수 있고 `.env`는 건드리지 않습니다. `--no-db`는 DB를 건드리지 않음. Ctrl+C로 끄면 자식 프로세스까지 정리 |
| `meerkit stop` | 이 프로젝트의 서버를 끕니다. 다른 프로그램이 쓰는 포트는 건드리지 않고 알려 줍니다. `--db`는 DB도 멈춤 (macOS/Linux) |
| `meerkit status` | 세팅 여부, DB, 마이그레이션 최신 여부, 3000·8000 포트 소유자와 응답을 한눈에 봅니다 |
| `meerkit check` | Node.js, npm, uv, Docker(설치와 실행 여부)만 점검 |
| `meerkit env check [--prod]` | `backend/.env`를 점검합니다. 값은 출력하지 않습니다. `--prod`는 운영 기준 |
| `meerkit logs [-n 줄수] [--path]` | `meerkit-setup.log` 마지막 부분 / 경로 |
| `meerkit db migrate` / `seed` / `reset` | 마이그레이션 / 로컬 관리자 계정 / 로컬 DB를 지우고 처음부터(프로젝트 폴더 이름 입력 필요, `localhost:5432`에서만) |
| `meerkit add feature <이름>` | 백엔드·테스트·프론트 화면 뼈대를 만들고 `api.py`에 등록. `--dry-run`은 파일 목록만 |
| `meerkit test [--backend\|--frontend] [--fast]` | 백엔드 ruff·pytest, 프론트엔드 lint·build를 한 번에 |
| `meerkit open [web\|api]` | 브라우저로 열기 |
| `meerkit update [--apply]` | 새 킷 버전의 변경을 가져옵니다. 처음 받은 파일 기록(`.meerkit/manifest.json`)과 비교해, 안 고친 파일은 갱신하고 고친 파일은 `파일.meerkit-new`로 옆에 둡니다. 기본은 미리보기 |

`meerkit --help`로 전체 목록, `meerkit <명령> --help`로 각 명령의 사용법·옵션·예를 볼 수 있습니다. 도움말은 `src/help.js`의 `COMMANDS`에서 만들어지니, 명령을 추가하면 거기에도 적으세요.

### setup이 하는 일

1. **점검:** Node.js 20 이상, npm, uv, Docker/Compose/Docker Desktop 실행 여부, 3000·8000 포트. 하나라도 문제면 원인과 설치 링크를 보여 주고 멈춥니다.
2. `npm install` (frontend) → `uv sync` (backend)
3. `backend/.env` 생성과 JWT 비밀키 발급 (이미 있는 값은 덮어쓰지 않음), `frontend/.env.local` 생성
4. `docker compose up -d --wait db`
5. `alembic upgrade head`, 로컬용 관리자 계정 생성
6. 백엔드(8000)와 프론트엔드(3000) 시작

이미 끝난 단계는 건너뛰므로 다시 실행해도 안전합니다. 전체 로그는 프로젝트 루트의 `meerkit-setup.log`(비밀 값은 기록하지 않음)에 남고, 실패하면 원인·해결 방법·다시 실행할 명령·로그 위치를 보여 줍니다.

## 패키지 구조

| 패키지 | 역할 |
| --- | --- |
| `@snackcup/meerkit` (이 폴더) | 본체. `template/`에 프로젝트 템플릿을 함께 넣어 배포합니다 |
| `create-meerkit` (`../create-meerkit`) | `npx create-meerkit`의 입구. `@snackcup/meerkit`의 `init`을 실행합니다 |

`npx create-xxx`는 이름이 정확히 `create-xxx`인 패키지를 찾기 때문에 두 개가 필요합니다.

## 템플릿

`template/`은 `scripts/sync-template.mjs`가 저장소에서 만듭니다 (git이 추적하는 파일만 복사). 직접 고치지 마세요. 배포 직전(`npm pack`, `npm publish`)에 자동으로 다시 만들어집니다.

- 빼는 것: 팀 문서(`docs/`), `CLAUDE.md`, `.claude/`, `.env`, `node_modules`, 예시 기능의 테스트 등
- 사용 설명서(프론트의 `/docs` 화면과 `src/meerkit/docs`)는 통째로 뺍니다. 설명서는 별도 사이트로 배포하고, 앱에는 웰컴 페이지만 남습니다. 설명서 주소를 `NEXT_PUBLIC_DOCS_URL`에 넣으면 웰컴 페이지에 Docs 버튼이 나타납니다.
- 템플릿에 서비스 코드 흔적(`maemusae`, `gsap` 등)이나 비밀 파일이 있으면 스크립트가 실패합니다.

```bash
cd packages
npm install                  # workspace 연결
npm run sync-template -w meerkit
npm test -w meerkit
```

## 배포 체크리스트 (사람이 합니다)

1. 라이선스: MIT (저장소 루트 `LICENSE`, 두 `package.json`에 반영됨). 바꾸려면 세 곳을 함께 고칩니다.
2. `npm login` (2단계 인증 켜기). 이름 `@snackcup/meerkit`(npm 조직 `snackcup`), `create-meerkit`이 비어 있는지 `npm view <이름>`으로 확인합니다.
3. 버전 올리기 (두 패키지 모두, `create-meerkit`의 `@snackcup/meerkit` 의존 범위도 맞추기)
4. `npm pack --dry-run -w meerkit`로 들어가는 파일 목록 확인 (`.env`, 비밀 값이 없어야 함)
5. 로컬 시험: `npm pack -w meerkit -w create-meerkit` → 임시 폴더에 설치 → `npx create-meerkit my-app` → `npx @snackcup/meerkit setup`
6. `npm publish -w meerkit --access public` **먼저**, 그다음 `npm publish -w create-meerkit --access public` (순서가 바뀌면 `create-meerkit`이 없는 `meerkit`을 찾습니다)
7. 깨끗한 곳에서 `npx create-meerkit@latest my-app`으로 확인

배포는 공개되고 되돌리기 어렵습니다 (72시간 안에만 `npm unpublish` 가능).
