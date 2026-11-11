"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { initialTerms, statsPeriods, statsSeries, statsSummary, type KitTerm } from "./mock";
import { Field, Panel, SectionTitle, StatCard, StatusBadge, SubTabs, Switch, textareaClass } from "./ui";

/* ─────────────────────────── 약관 ─────────────────────────── */

export function TermsTab() {
  const [terms, setTerms] = useState(initialTerms);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ title: initialTerms[0].title, required: "필수", effectiveAt: "2026-12-15" });
  const titles = [...new Set(initialTerms.map((t) => t.title))];

  const publish = () => {
    if (!draft.effectiveAt) return toast.error("시행일을 입력하세요.");
    const latest = terms.filter((t) => t.title === draft.title).length;
    const next: KitTerm = { id: Date.now(), title: draft.title, version: `v${latest + 1}`, required: draft.required === "필수", effectiveAt: draft.effectiveAt, status: "scheduled" };
    setTerms((list) => [next, ...list]);
    setWriting(false);
    toast.success(`${next.title} ${next.version}을 예약했습니다. (미리보기)`);
  };

  return (
    <>
      <SectionTitle
        title="약관 관리"
        description="약관 버전을 만들고 시행일을 예약합니다."
        action={<Button type="button" variant="outline" onClick={() => setWriting((v) => !v)}><Plus /> 새 버전 작성</Button>}
      />
      {writing && (
        <Panel className="grid gap-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="약관">
              <NativeSelect value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} wrapperClassName="w-full">
                {titles.map((t) => <option key={t} value={t}>{t}</option>)}
              </NativeSelect>
            </Field>
            <Field label="필수 여부">
              <NativeSelect value={draft.required} onChange={(e) => setDraft((d) => ({ ...d, required: e.target.value }))} wrapperClassName="w-full">
                <option>필수</option>
                <option>선택</option>
              </NativeSelect>
            </Field>
            <Field label="시행일"><Input type="date" value={draft.effectiveAt} onChange={(e) => setDraft((d) => ({ ...d, effectiveAt: e.target.value }))} /></Field>
          </div>
          <Field label="본문"><textarea className={textareaClass} placeholder="약관 내용을 입력하세요." /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setWriting(false)}>취소</Button>
            <Button type="button" onClick={publish}>예약 게시</Button>
          </div>
        </Panel>
      )}
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>약관</TableHead>
              <TableHead>버전</TableHead>
              <TableHead>필수</TableHead>
              <TableHead>시행일</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell className="tabular-nums">{t.version}</TableCell>
                <TableCell>{t.required ? "필수" : "선택"}</TableCell>
                <TableCell className="tabular-nums">{t.effectiveAt}</TableCell>
                <TableCell><StatusBadge tone={t.status === "active" ? "brand" : "outline"}>{t.status === "active" ? "시행 중" : "예약"}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

/* ─────────────────────────── 시스템 ─────────────────────────── */

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-surface px-4 py-3">
      <div className="grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function SystemTab() {
  const [basic, setBasic] = useState({ name: "미어킷", email: "help@meerkit.dev", maxAttempts: "5", lockMinutes: "15", verifyEmail: true });
  const [security, setSecurity] = useState({ sessionMinutes: "60", minLength: "8", twoFactor: false });
  const [maintenance, setMaintenance] = useState({ on: false, message: "더 나은 서비스를 위해 점검 중입니다. 잠시 후 다시 이용해 주세요." });
  const save = () => toast.success("변경 사항을 저장했습니다. (미리보기)");

  return (
    <>
      <SectionTitle title="시스템 설정" description="서비스 기본 정보와 보안, 점검 모드를 정합니다." />
      <SubTabs
        items={[
          {
            id: "basic",
            label: "기본 정보",
            render: () => (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="서비스 이름"><Input value={basic.name} onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))} /></Field>
                  <Field label="대표 이메일"><Input type="email" value={basic.email} onChange={(e) => setBasic((b) => ({ ...b, email: e.target.value }))} /></Field>
                  <Field label="로그인 실패 허용 횟수"><Input type="number" min={1} value={basic.maxAttempts} onChange={(e) => setBasic((b) => ({ ...b, maxAttempts: e.target.value }))} /></Field>
                  <Field label="잠금 시간(분)"><Input type="number" min={1} value={basic.lockMinutes} onChange={(e) => setBasic((b) => ({ ...b, lockMinutes: e.target.value }))} /></Field>
                </div>
                <Row label="이메일 인증 필수" hint="가입할 때 이메일 인증을 거치게 합니다."><Switch label="이메일 인증 필수" checked={basic.verifyEmail} onChange={(v) => setBasic((b) => ({ ...b, verifyEmail: v }))} /></Row>
                <div><Button type="button" variant="outline" onClick={save}>변경 사항 저장</Button></div>
              </>
            ),
          },
          {
            id: "security",
            label: "보안",
            render: () => (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="로그인 유지 시간(분)"><Input type="number" min={5} value={security.sessionMinutes} onChange={(e) => setSecurity((s) => ({ ...s, sessionMinutes: e.target.value }))} /></Field>
                  <Field label="비밀번호 최소 길이"><Input type="number" min={6} value={security.minLength} onChange={(e) => setSecurity((s) => ({ ...s, minLength: e.target.value }))} /></Field>
                </div>
                <Row label="2단계 인증 권장" hint="관리자 계정에 2단계 인증을 안내합니다."><Switch label="2단계 인증 권장" checked={security.twoFactor} onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))} /></Row>
                <div><Button type="button" variant="outline" onClick={save}>변경 사항 저장</Button></div>
              </>
            ),
          },
          {
            id: "maintenance",
            label: "점검 모드",
            render: () => (
              <>
                <Row label="점검 모드" hint="켜면 관리자를 뺀 모든 사용자에게 점검 안내가 보입니다."><Switch label="점검 모드" checked={maintenance.on} onChange={(v) => setMaintenance((m) => ({ ...m, on: v }))} /></Row>
                <Field label="점검 안내 문구"><textarea className={textareaClass} value={maintenance.message} onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))} /></Field>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={save}>변경 사항 저장</Button>
                  <StatusBadge tone={maintenance.on ? "red" : "gray"}>{maintenance.on ? "점검 중" : "정상 운영"}</StatusBadge>
                </div>
              </>
            ),
          },
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 접속 통계 ─────────────────────────── */

const chartConfig = { value: { label: "방문자", color: "var(--mk-brand)" } } satisfies ChartConfig;

function StatsPanel({ period }: { period: keyof typeof statsSeries }) {
  const meta = statsPeriods.find((p) => p.id === period) ?? statsPeriods[0];
  const points = statsSeries[period];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsSummary[period].map((s) => <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} tone={s.down ? "down" : "up"} />)}
      </div>
      <Panel className="p-5">
        <p className="mb-3 text-sm text-muted-foreground">{meta.chartTitle}</p>
        <ChartContainer config={chartConfig} role="img" aria-label={`${meta.chartTitle} 막대 차트`} className="aspect-auto h-60 w-full">
          <BarChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent valueFormatter={(v) => `${Number(v).toLocaleString("ko-KR")}명`} />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Panel>
    </>
  );
}

export function StatsTab() {
  return (
    <>
      <SectionTitle title="사용자 접속 통계 대시보드" description="방문자와 이용 추이를 일·주·월 단위로 봅니다." />
      <SubTabs items={statsPeriods.map((p) => ({ id: p.id, label: p.label, render: () => <StatsPanel period={p.id} /> }))} />
    </>
  );
}
