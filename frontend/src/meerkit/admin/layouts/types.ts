import type { ComponentType } from "react";

export type AdminLayoutKind = "sidebar" | "tabs";

export interface AdminLayoutItem {
  id: string;
  label: string;
  Content: ComponentType;
}

/** 레이아웃(틀)이 받는 값. 내용은 items의 Content가 그리고, 틀은 어떤 섹션인지 모른다. */
export interface AdminLayoutProps {
  items: AdminLayoutItem[];
  /** 서비스 이름. 헤더 왼쪽에 보인다 */
  serviceName?: string;
  /** "서비스로" 링크가 가는 주소 */
  backHref?: string;
  backLabel?: string;
  className?: string;
}
