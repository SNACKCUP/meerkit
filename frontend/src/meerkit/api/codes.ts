import type { CodeGroup } from "../types";
import { api } from "./client";

export const codesApi = {
  // 공통코드 묶음 하나. 공개 묶음(예: MEERKIT_GENDER)은 로그인 전에도 읽을 수 있다
  getGroup: (groupCode: string) => api.get<CodeGroup>(`/codes/${groupCode}`).then((r) => r.data),
};
