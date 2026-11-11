"use client";

import { Download, Plus, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  KIT_ROLES,
  auditRows,
  initialCodeGroups,
  initialEmailTemplates,
  initialMembers,
  type AuditKind,
  type CommonCode,
  type KitMember,
  type MemberStatus,
} from "./mock";
import { Field, Panel, SectionTitle, StatusBadge, SubTabs, Switch, textareaClass } from "./ui";

const STATUS_LABEL: Record<MemberStatus, string> = { active: "활성", locked: "잠김", withdrawn: "탈퇴" };

/* ─────────────────────────── 회원 ─────────────────────────── */

function MemberList({ members, scope, onChange }: { members: KitMember[]; scope: "all" | MemberStatus; onChange: (id: number, patch: Partial<KitMember>) => void }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(
    () =>
      members.filter((m) => {
        if (scope !== "all" && m.status !== scope) return false;
        if (scope === "all" && m.status === "withdrawn") return false;
        if (role && m.role !== role) return false;
        if (status && m.status !== status) return false;
        const needle = q.trim().toLowerCase();
        return !needle || m.name.toLowerCase().includes(needle) || m.email.toLowerCase().includes(needle);
      }),
    [members, scope, q, role, status],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 이메일 검색" aria-label="회원 검색" className="pl-9" />
        </div>
        <NativeSelect value={role} onChange={(e) => setRole(e.target.value)} aria-label="역할 필터" wrapperClassName="min-w-32">
          <option value="">모든 역할</option>
          {KIT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </NativeSelect>
        {scope === "all" && (
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="상태 필터" wrapperClassName="min-w-32">
            <option value="">모든 상태</option>
            <option value="active">활성</option>
            <option value="locked">잠김</option>
          </NativeSelect>
        )}
      </div>
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">조건에 맞는 회원이 없습니다.</TableCell></TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.email}</TableCell>
                <TableCell>{m.role}</TableCell>
                <TableCell className="tabular-nums">{m.joinedAt}</TableCell>
                <TableCell><StatusBadge tone={m.status === "active" ? "brand" : m.status === "locked" ? "red" : "gray"}>{STATUS_LABEL[m.status]}</StatusBadge></TableCell>
                <TableCell className="text-right">
                  {m.status === "withdrawn" ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => { onChange(m.id, { status: "active" }); toast.success(`${m.name} 회원을 복구했습니다. (미리보기)`); }}>복구</Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = m.status === "locked" ? "active" : "locked";
                        onChange(m.id, { status: next });
                        toast.success(`${m.name} 계정을 ${next === "locked" ? "잠갔습니다" : "잠금 해제했습니다"}. (미리보기)`);
                      }}
                    >
                      {m.status === "locked" ? "잠금 해제" : "잠금"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

export function MembersTab() {
  const [members, setMembers] = useState(initialMembers);
  const patch = (id: number, p: Partial<KitMember>) => setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...p } : m)));
  return (
    <>
      <SectionTitle title="회원 관리" description="회원을 검색하고 계정 상태를 바꿉니다." />
      <SubTabs
        items={[
          { id: "list", label: "회원 목록", render: () => <MemberList members={members} scope="all" onChange={patch} /> },
          { id: "locked", label: "잠긴 계정", render: () => <MemberList members={members} scope="locked" onChange={patch} /> },
          { id: "withdrawn", label: "탈퇴 회원", render: () => <MemberList members={members} scope="withdrawn" onChange={patch} /> },
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 감사 로그 ─────────────────────────── */

function csvCell(v: string) {
  return `"${v.replaceAll('"', '""')}"`;
}

function AuditList({ kind }: { kind: "all" | AuditKind }) {
  const [admin, setAdmin] = useState("");
  const [action, setAction] = useState("");
  const admins = [...new Set(auditRows.map((r) => r.admin))];

  const rows = auditRows.filter((r) => (kind === "all" || r.kind === kind) && (!admin || r.admin === admin) && (!action || r.kind === action));

  const exportCsv = () => {
    const head = ["시각", "관리자", "행위", "대상", "IP"];
    const body = rows.map((r) => [r.at, r.admin, r.action, r.target, r.ip].map(csvCell).join(","));
    const blob = new Blob(["﻿" + [head.map(csvCell).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input type="date" defaultValue="2026-11-09" aria-label="날짜" className="w-auto min-w-40" />
        <NativeSelect value={admin} onChange={(e) => setAdmin(e.target.value)} aria-label="관리자 필터" wrapperClassName="min-w-36">
          <option value="">모든 관리자</option>
          {admins.map((a) => <option key={a} value={a}>{a}</option>)}
        </NativeSelect>
        {kind === "all" && (
          <NativeSelect value={action} onChange={(e) => setAction(e.target.value)} aria-label="행위 필터" wrapperClassName="min-w-36">
            <option value="">모든 행위</option>
            <option value="role">권한 변경</option>
            <option value="login">로그인</option>
            <option value="etc">기타</option>
          </NativeSelect>
        )}
        <Button type="button" variant="outline" onClick={exportCsv}><Download /> CSV</Button>
      </div>
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시각</TableHead>
              <TableHead>관리자</TableHead>
              <TableHead>행위</TableHead>
              <TableHead>대상</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">기록이 없습니다.</TableCell></TableRow>}
            {rows.map((r, i) => (
              <TableRow key={`${r.at}-${i}`}>
                <TableCell className="whitespace-nowrap tabular-nums">{r.at}</TableCell>
                <TableCell className="font-medium">{r.admin}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell>{r.target}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{r.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

export function AuditTab() {
  return (
    <>
      <SectionTitle title="감사 로그 관리" description="관리자가 한 일을 시각 순으로 확인하고 CSV로 내려받습니다." />
      <SubTabs
        items={[
          { id: "all", label: "전체 로그", render: () => <AuditList kind="all" /> },
          { id: "role", label: "권한 변경", render: () => <AuditList kind="role" /> },
          { id: "login", label: "로그인 이력", render: () => <AuditList kind="login" /> },
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 공통 코드 ─────────────────────────── */

export function CodesTab() {
  const [groups, setGroups] = useState(initialCodeGroups);
  const [current, setCurrent] = useState(Object.keys(initialCodeGroups)[0]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: "", name: "" });

  const group = groups[current];
  const update = (fn: (codes: CommonCode[]) => CommonCode[]) => setGroups((g) => ({ ...g, [current]: { ...g[current], codes: fn(g[current].codes) } }));

  const add = () => {
    const code = draft.code.trim().toUpperCase();
    const name = draft.name.trim();
    if (!code || !name) return toast.error("코드와 이름을 모두 입력하세요.");
    if (group.codes.some((c) => c.code === code)) return toast.error("이미 있는 코드입니다.");
    update((codes) => [...codes, { code, name, order: codes.length + 1, enabled: true }]);
    setDraft({ code: "", name: "" });
    setAdding(false);
  };

  return (
    <>
      <SectionTitle title="공통 코드 관리" description="화면에 보이는 분류값을 묶음별로 관리합니다." />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Panel className="h-fit overflow-hidden">
          <ul role="listbox" aria-label="코드 묶음">
            {Object.keys(groups).map((key) => (
              <li key={key} className="border-b last:border-b-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={key === current}
                  onClick={() => setCurrent(key)}
                  className={cn("w-full px-4 py-3 text-left text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:bg-muted", key === current && "bg-muted text-brand")}
                >
                  {key}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{current}</span> · {group.label}</p>
            <Button type="button" variant="outline" onClick={() => setAdding((v) => !v)}><Plus /> 코드 추가</Button>
          </div>
          {adding && (
            <Panel className="flex flex-wrap items-end gap-3 p-4">
              <Field label="코드" className="min-w-32 flex-1"><Input value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} placeholder="EXAMPLE" /></Field>
              <Field label="이름" className="min-w-32 flex-1"><Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="예시" /></Field>
              <Button type="button" onClick={add}>추가</Button>
            </Panel>
          )}
          <Panel className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>순서</TableHead>
                  <TableHead>사용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.codes.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono text-[13px]">{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="tabular-nums">{c.order}</TableCell>
                    <TableCell><Switch label={`${c.code} 사용`} checked={c.enabled} onChange={(v) => update((codes) => codes.map((x) => (x.code === c.code ? { ...x, enabled: v } : x)))} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── 이메일 ─────────────────────────── */

export function EmailTab() {
  const [templates, setTemplates] = useState(initialEmailTemplates);
  const [currentId, setCurrentId] = useState(templates[0].id);
  const current = templates.find((t) => t.id === currentId) ?? templates[0];
  const patch = (p: Partial<{ subject: string; body: string }>) => setTemplates((list) => list.map((t) => (t.id === current.id ? { ...t, ...p } : t)));

  return (
    <>
      <SectionTitle title="이메일 콘텐츠 관리" description="서비스가 보내는 메일의 제목과 본문을 고칩니다." />
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Panel className="h-fit overflow-hidden">
          <ul role="listbox" aria-label="메일 템플릿">
            {templates.map((t) => (
              <li key={t.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={t.id === current.id}
                  onClick={() => setCurrentId(t.id)}
                  className={cn("w-full px-4 py-3 text-left text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:bg-muted", t.id === current.id && "bg-muted text-brand")}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="grid min-w-0 gap-4">
          <Field label="제목"><Input value={current.subject} onChange={(e) => patch({ subject: e.target.value })} /></Field>
          <Field label="본문"><textarea value={current.body} onChange={(e) => patch({ body: e.target.value })} className={textareaClass} /></Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              변수 {current.variables.map((v) => <code key={v} className="mr-1.5 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{v}</code>)}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => toast.success("테스트 메일을 보냈습니다. (미리보기)")}><Send /> 테스트 발송</Button>
              <Button type="button" onClick={() => toast.success("저장했습니다. (미리보기)")}>저장</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
