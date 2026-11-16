"use client";

import { useAuth } from "../hooks";
import { useAuthDialog } from "../dialog-store";
import { LoadingState } from "../../loading";
import { Button } from "@/components/ui/button";

interface RequireAuthProps {
  children: React.ReactNode;
  // 로그인하지 않았을 때 보여 줄 화면. 없으면 기본 안내(문구 + 로그인 버튼)를 쓴다.
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const openDialog = useAuthDialog((s) => s.openDialog);

  if (isLoading) return <LoadingState fullPage />;
  if (!isAuthenticated) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center gap-3 p-10">
        <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
        <Button onClick={() => openDialog("login")}>로그인</Button>
      </div>
    );
  }
  return <>{children}</>;
}
