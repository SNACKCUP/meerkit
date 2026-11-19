import { useQuery } from "@tanstack/react-query";

import { authApi } from "../api/auth";
import { codesApi } from "../api/codes";
import { useAuthStore } from "./store";

export const meKey = ["meerkit", "me"] as const;

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  // staleTime을 두지 않으면 같은 화면에서 useMe를 쓰는 부품이 새로 나타날 때마다 내 정보를 다시 요청한다
  // (가드가 먼저 불러온 뒤 본문이 마운트되면서 한 번 더). 내 정보는 수정할 때 setQueryData로 갱신하므로 잠깐은 새것으로 본다.
  return useQuery({ queryKey: meKey, queryFn: authApi.me, enabled: !!accessToken, retry: false, staleTime: 60_000 });
}

/** 성별 공통코드 (MEERKIT_GENDER). 로그인 전에도 읽는다. 실패하면 data 가 없으니 부르는 쪽이 기본 목록을 쓴다 */
export const GENDER_CODE_GROUP = "MEERKIT_GENDER";

export function useGenderCodes() {
  return useQuery({
    queryKey: ["meerkit", "codes", GENDER_CODE_GROUP],
    queryFn: () => codesApi.getGroup(GENDER_CODE_GROUP),
    retry: false,
    staleTime: 10 * 60_000,
  });
}
