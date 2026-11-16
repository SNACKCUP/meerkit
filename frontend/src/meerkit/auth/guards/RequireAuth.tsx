"use client";

import { useAuth } from "../hooks";
import { useAuthDialog } from "../dialog-store";
import { LoadingState } from "../../loading";
import { Button } from "@/components/ui/button";

type RequireAuthProps = {
  children: React.ReactNode;
  /** 로그인하지 않았을 때 그릴 화면. 없으면 킷 기본 안내(문구 + 로그인 버튼)를 그린다. */
  fallback?: React.ReactNode;
};

function LoginRequired() {
  const openDialog = useAuthDialog((s) => s.openDialog);
  return (
    <div className="flex flex-col items-center gap-3 p-10">
      <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
      <Button onClick={() => openDialog("login")}>로그인</Button>
    </div>
  );
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingState fullPage />;
  // fallback={null}처럼 아무것도 그리지 않는 값도 그대로 쓴다 (undefined일 때만 기본 안내)
  if (!isAuthenticated) return fallback !== undefined ? <>{fallback}</> : <LoginRequired />;
  return <>{children}</>;
}
