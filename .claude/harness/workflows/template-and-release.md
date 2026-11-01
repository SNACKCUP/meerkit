# 템플릿 동기화와 npm 배포 순서

> 대상: `packages/meerkit`(본체, 명령 `meerkit`)와 `packages/create-meerkit`. 둘의 버전은 항상 같이 올린다. 템플릿은 `sync-template.mjs`가 git 추적 파일에서 만들며(`prepack`), 저장소는 `main`에 PR과 검사(`test`, `build`)가 필요하다.

## 템플릿과 Fork의 일관성

- Always: 저장소 그대로(Fork/clone)와 템플릿으로 만든 프로젝트 둘 다에서 `setup`을 끝까지 돌려 본다. (이유: 템플릿만 검증해서 Fork의 DB 주소 불일치를 놓쳤다. `backend/.env.example`의 기본 DB가 Supabase 54322였고 `setup`이 띄우는 DB는 5432였다)
- Never: 템플릿 생성 단계에서만 설정 값을 덮어써 저장소의 기본값과 어긋나게 하지 않는다. 기본값 자체를 맞추고, 템플릿은 대체용 줄만 뺀다.
- Always: 사용자 프로젝트에 들어가지 않아야 할 파일(`frontend/e2e`, `playwright.config.ts`, 설명서 코드)은 `sync-template.mjs`의 제외 목록과 마지막 검사(문제 목록)에 함께 넣는다. 제외 후 `init` → `npm ci` → `lint` → `build`로 확인한다.
- Always: 루트 `npm install`(Supabase CLI)은 선택 사항이다. 시작 안내에 필수 단계로 쓰지 않는다. (이유: 용량이 커서 디스크가 부족한 환경에서 ENOSPC가 났다)

## 배포 순서

1. 버전 올리는 PR을 만든다(두 패키지와 `packages/package-lock.json`) → 검사 통과 후 병합.
2. 사용자가 `main`을 받은 뒤 `packages`에서 `npm publish --workspace <이름> --tag next`로 올린다.
3. 올라간 것을 `npm view <이름> dist-tags --json`, `versions`로 확인한다. 반영이 늦을 수 있으니 몇 번 다시 본다.
4. `init` → `setup` 등으로 새 버전을 검증한다.
5. 사용자가 `npm dist-tag add <이름>@<버전> latest`로 `latest`를 옮긴다. 옮긴 뒤 버전 없는 `npx @snackcup/meerkit --version`으로 확인한다.

## 배포 오류 읽기

- Always: 배포 직후에는 실패로 판단하기 전에 `npm view`를 20~60초 간격으로 몇 번 다시 확인한다. (이유: E403 "previously published"는 이미 올라간 상태였고 레지스트리 반영만 늦었다)
- Always: E404/401(PUT)은 `npm login` 만료, E409 "previously staged"는 올리는 중이거나 승인 대기인 버전으로 읽고, 사용자에게 로그인·승인 여부를 확인한다.
- Never: 확인하지 않은 추측을 사실처럼 안내하지 않는다. (이유: "npx가 오래된 캐시를 쓴다"고 말했지만 실험 결과 버전 없는 `npx`는 `latest`를 가져왔다)
- Never: 사용자 대신 `npm login`, `npm publish`, `dist-tag`를 실행하지 않는다. 명령을 알려 주고 사용자가 실행한 뒤 검증한다.
