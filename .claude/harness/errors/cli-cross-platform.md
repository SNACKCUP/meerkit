# CLI의 Windows·줄바꿈 주의점

> 대상: `packages/meerkit/` (`sync-template.mjs`, `manifest.js`, `update.js`, `stop.js`, `status.js`), `.gitattributes`, `.github/workflows/cli-ci.yml`.

- Always: 저장소 루트에 `* text=auto eol=lf`(`.gitattributes`)를 둔다. (이유: Windows 체크아웃의 CRLF 때문에 `sync-template`의 정규식이 깨져 "WelcomePage에서 docsButton을 찾지 못했습니다"로 CI가 실패했다)
- Always: `update`의 파일 해시는 텍스트 파일의 CRLF를 LF로 바꿔 계산하고, NUL 바이트가 있는 바이너리는 그대로 계산한다. (이유: 같은 파일이 OS에 따라 다르게 보여 불필요한 충돌이 났다)
- Always: 줄바꿈에 민감한 코드(정규식 치환, 해시 비교)는 Windows 러너(`cli-ci.yml`의 matrix)에서 테스트한다. 로컬 macOS 통과만으로 끝내지 않는다.
- Never: `lsof`/`ps`/`pgrep`에 기대는 동작(`stop`, 포트 소유자 표시)을 Windows에서 된다고 문서에 쓰지 않는다. 확인 전에는 "지원하지 않음, 서버를 띄운 터미널에서 Ctrl+C"로 안내한다. (이유: Windows 실제 PC에서는 아직 검증하지 못했다)
- Never: GitHub Actions의 Windows 러너에서 Docker를 쓰는 검증을 기대하지 않는다. 러너에 Docker가 없어서 CI는 단위 테스트와 `init` 스모크까지만 한다.
