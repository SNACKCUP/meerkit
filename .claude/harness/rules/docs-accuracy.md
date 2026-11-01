# 문서와 실제 동작의 일치

> 대상: `docs/`, `CLAUDE.md`, 설명서(`frontend/src/meerkit/docs/`), CLI 도움말(`packages/meerkit/src/help.js`).

- Never: 자동 검사(ESLint, 테스트, CI, 마이그레이션 검사)가 있다고 문서에 쓰기 전에 설정 파일에 실제로 있는지 확인한다. (이유: `architecture.md`, `how-to-add-feature.md`, `CLAUDE.md`가 "ESLint가 검사한다"고 적었지만 규칙이 어디에도 없었다)
- Always: 규칙을 문서로만 두지 말고 가능하면 검사로 만든다. 프론트 import 방향은 `frontend/eslint.config.mjs`의 `no-restricted-imports`, 백엔드는 `tests/test_import_rules.py`가 검사한다.
- Always: 문서와 코드가 짝인 곳은 일치 테스트를 둔다. CLI 설명집(`docs/content/cli.tsx`)은 `cli.test.js`가 `help.js`의 명령과 옵션이 모두 있는지 확인한다. (이유: 설명집을 쓰다가 `open`과 `--dir` 설명이 코드와 달랐다)
- Always: 명령이나 옵션의 동작을 문서에 쓸 때는 구현 코드와 실제 실행 결과를 확인한 뒤에 쓴다. 이름만 보고 짐작하지 않는다.
- Always: 문서의 기본값(포트, DB 주소, 환경 변수)을 바꾸면 `README.md`, `시작하기.md`, 하네스 문서에서 같은 값을 `grep`으로 찾아 함께 고친다. (이유: 기본 DB를 docker-compose로 바꿨는데 `db-migration.md`는 Supabase가 기본이라고 남아 있었다)
