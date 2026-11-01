# CLI의 Docker·로컬 DB 주의점

> 대상: `packages/meerkit/` (`checks.js`, `setup.js`, `start.js`, `db.js`)와 루트 `docker-compose.yml`. 생성된 프로젝트와 저장소를 Fork한 프로젝트의 로컬 DB는 `docker compose`의 PostgreSQL 16(포트 5432)이다.

## Docker 상태 진단

- Never: Docker 명령의 타임아웃을 "실행 중이 아님"으로 해석하지 않는다. 무응답(`ETIMEDOUT`)과 미실행을 구분해서 안내한다. (이유: 디스크가 가득 차면 켜져 있는 Docker Desktop이 멈춰 `docker info`가 응답하지 않는데, 꺼진 것으로 오진해 원인 추적이 오래 걸렸다)
- Always: 설치·`setup` 전에 디스크 여유 공간(최소 2GB)을 확인하고, 부족하면 해결 방법과 함께 멈춘다. (이유: `npm install`의 ENOSPC와 Docker 멈춤이 같은 원인에서 함께 났다)
- Always: Docker가 멈춘 경우의 안내는 "공간 확보 → Docker Desktop 재시작 → 재시도" 순서로 쓴다.

## DB 준비 확인

- Always: DB 컨테이너 healthcheck는 `pg_isready -h 127.0.0.1 -U starter -d starter`처럼 TCP로 확인한다. (이유: 초기화용 임시 서버는 TCP를 받지 않아서, 소켓만 보는 확인은 너무 일찍 통과한다)
- Never: DB가 "시작됨"이라는 사실만으로 마이그레이션을 시작하지 않는다. `healthy`가 될 때까지 기다린다. (이유: 첫 `setup`의 마이그레이션이 `server closed the connection unexpectedly`로 4번 중 1번꼴로 실패했다)
- Always: `docker-compose.yml`의 healthcheck가 유지되는지 `cli.test.js`의 확인을 통과시킨다.

## 포트

- Always: 포트 사용 여부는 `127.0.0.1`과 전체 주소(wildcard) 둘 다 시도해서 판단한다. (이유: 모든 주소로 연 서버를 빈 포트로 오판해 서버를 켠 뒤 `EADDRINUSE`가 났다)
- Always: 브라우저가 막는 포트(예: 6000, `ERR_UNSAFE_PORT`)는 `--api-port` 예시에 쓰지 않는다. 문서 예시는 8100을 쓴다.
