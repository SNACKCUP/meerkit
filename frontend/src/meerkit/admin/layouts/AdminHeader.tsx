import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  serviceName: string;
  backHref: string;
  backLabel: string;
}

// 사이드바형과 탭형이 같이 쓰는 위쪽 줄
export function AdminHeader({ serviceName, backHref, backLabel }: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold tracking-tight">{serviceName}</span>
        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Admin</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">MK</span>
      </div>
    </header>
  );
}
