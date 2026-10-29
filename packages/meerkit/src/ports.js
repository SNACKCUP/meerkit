import { readPidFile } from "./proc.js";

export const DEFAULT_PORTS = { web: 3000, api: 8000 };

/** --port(프론트엔드)와 --api-port(백엔드)를 읽는다. 문제가 있으면 { error } */
export function parsePorts(args) {
  const read = (flag) => {
    const i = args.indexOf(flag);
    if (i < 0) return { value: null };
    const raw = args[i + 1];
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n < 1024 || n > 65535) return { error: `${flag} 값이 올바르지 않습니다: ${raw ?? "(없음)"}  (1024~65535 사이 숫자)` };
    return { value: n };
  };
  const web = read("--port");
  const api = read("--api-port");
  if (web.error || api.error) return { error: web.error || api.error };
  const ports = { web: web.value ?? DEFAULT_PORTS.web, api: api.value ?? DEFAULT_PORTS.api };
  if (ports.web === ports.api) return { error: "프론트엔드와 백엔드 포트가 같을 수 없습니다." };
  return { ports };
}

/** 지금 켜져 있는 서버가 쓰는 포트. start가 기록해 둔 값이 있으면 그것, 없으면 기본값. */
export async function activePorts(root) {
  const rec = await readPidFile(root);
  const p = rec?.ports;
  return { web: Number.isInteger(p?.web) ? p.web : DEFAULT_PORTS.web, api: Number.isInteger(p?.api) ? p.api : DEFAULT_PORTS.api };
}
