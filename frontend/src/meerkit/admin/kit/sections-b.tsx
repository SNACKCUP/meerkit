"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  KIT_ROLES,
  PERMISSIONS,
  PROFANITY_ACTIONS,
  initialAdminAccounts,
  initialBoards,
  initialPermissionMatrix,
  initialPosts,
  initialReports,
  profanityDefaults,
  profanityExceptionDefaults,
  type KitRole,
} from "./mock";
import { Panel, SectionTitle, StatCard, StatusBadge, SubTabs, Switch } from "./ui";

/* ─────────────────────────── 비속어 ─────────────────────────── */

function WordManager({ words, onChange, placeholder, showAction }: { words: string[]; onChange: (next: string[]) => void; placeholder: string; showAction?: boolean }) {
  const [draft, setDraft] = useState("");
  const [action, setAction] = useState<string>(PROFANITY_ACTIONS[0]);

  const add = () => {
    const word = draft.trim();
    if (!word) return;
    if (words.includes(word)) return toast.error("이미 등록된 단어입니다.");
    onChange([...words, word]);
    setDraft("");
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) add();
          }}
          placeholder={placeholder}
          aria-label="단어 입력"
          className="min-w-40 flex-1"
        />
        <Button type="button" variant="outline" onClick={add}><Plus /> 추가</Button>
        {showAction && (
          <NativeSelect value={action} onChange={(e) => setAction(e.target.value)} aria-label="처리 방식" wrapperClassName="min-w-48">
            {PROFANITY_ACTIONS.map((a) => <option key={a} value={a}>처리: {a}</option>)}
          </NativeSelect>
        )}
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="등록된 단어">
        {words.map((w) => (
          <li key={w} className="inline-flex items-center gap-1 rounded-full border bg-surface py-1 pl-3 pr-1.5 text-sm shadow-xs">
            {w}
            <button type="button" aria-label={`${w} 삭제`} onClick={() => onChange(words.filter((x) => x !== w))} className="grid size-5 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted">
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {words.length === 0 && <li className="text-sm text-muted-foreground">등록된 단어가 없습니다.</li>}
      </ul>
    </>
  );
}

export function ProfanityTab() {
  const [words, setWords] = useState(profanityDefaults);
  const [exceptions, setExceptions] = useState(profanityExceptionDefaults);

  return (
    <>
      <SectionTitle title="비속어 관리" description="금칙어를 등록하고 걸러낼 때의 처리 방식을 정합니다." />
      <SubTabs
        items={[
          {
            id: "dict",
            label: "금칙어 사전",
            render: () => (
              <>
                <WordManager words={words} onChange={setWords} placeholder="금칙어 입력" showAction />
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="등록 단어" value={String(words.length)} />
                  <StatCard label="오늘 걸러낸 글" value="17" />
                  <StatCard label="적용 범위" value="게시글·댓글·닉네임" />
                </div>
              </>
            ),
          },
          {
            id: "except",
            label: "예외 단어",
            render: () => (
              <>
                <p className="text-sm text-muted-foreground">금칙어가 들어 있어도 걸러내지 않을 단어입니다.</p>
                <WordManager words={exceptions} onChange={setExceptions} placeholder="예외 단어 입력" />
              </>
            ),
          },
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 게시판 ─────────────────────────── */

function BoardList() {
  const [boards, setBoards] = useState(initialBoards);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const add = () => {
    const value = name.trim();
    if (!value) return toast.error("게시판 이름을 입력하세요.");
    setBoards((list) => [...list, { id: Date.now(), name: value, type: "일반", writeRole: "WRITER 이상", comments: true, posts: 0, enabled: true }]);
    setName("");
    setAdding(false);
  };

  return (
    <>
      <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setAdding((v) => !v)}><Plus /> 게시판 만들기</Button></div>
      {adding && (
        <Panel className="flex flex-wrap items-end gap-3 p-4">
          <label className="grid min-w-48 flex-1 gap-1.5 text-sm"><span className="text-muted-foreground">게시판 이름</span><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 후기" /></label>
          <Button type="button" onClick={add}>만들기</Button>
        </Panel>
      )}
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>게시판</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>글쓰기 권한</TableHead>
              <TableHead>댓글</TableHead>
              <TableHead>게시물</TableHead>
              <TableHead>사용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boards.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.type}</TableCell>
                <TableCell>{b.writeRole}</TableCell>
                <TableCell>{b.comments ? "on" : "off"}</TableCell>
                <TableCell className="tabular-nums">{b.posts.toLocaleString("ko-KR")}</TableCell>
                <TableCell><Switch label={`${b.name} 사용`} checked={b.enabled} onChange={(v) => setBoards((list) => list.map((x) => (x.id === b.id ? { ...x, enabled: v } : x)))} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

function PostList() {
  const [posts, setPosts] = useState(initialPosts);
  return (
    <Panel className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>게시판</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>작성일</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.board}</TableCell>
              <TableCell className={cn("font-medium", p.hidden && "text-muted-foreground line-through")}>{p.title}</TableCell>
              <TableCell>{p.author}</TableCell>
              <TableCell className="tabular-nums">{p.createdAt}</TableCell>
              <TableCell><StatusBadge tone={p.hidden ? "gray" : "brand"}>{p.hidden ? "숨김" : "공개"}</StatusBadge></TableCell>
              <TableCell className="text-right">
                <Button type="button" size="sm" variant="outline" onClick={() => setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, hidden: !x.hidden } : x)))}>{p.hidden ? "공개" : "숨김"}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function ReportList() {
  const [reports, setReports] = useState(initialReports);
  const resolve = (id: number, status: "accepted" | "rejected") => {
    setReports((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "accepted" ? "신고를 승인했습니다. (미리보기)" : "신고를 반려했습니다. (미리보기)");
  };
  return (
    <Panel className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>대상</TableHead>
            <TableHead>사유</TableHead>
            <TableHead>신고자</TableHead>
            <TableHead>접수</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">처리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.target}</TableCell>
              <TableCell>{r.reason}</TableCell>
              <TableCell>{r.reporter}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{r.at}</TableCell>
              <TableCell><StatusBadge tone={r.status === "pending" ? "outline" : r.status === "accepted" ? "red" : "gray"}>{r.status === "pending" ? "대기" : r.status === "accepted" ? "승인" : "반려"}</StatusBadge></TableCell>
              <TableCell className="text-right">
                {r.status === "pending" ? (
                  <span className="inline-flex gap-1.5">
                    <Button type="button" size="sm" onClick={() => resolve(r.id, "accepted")}>승인</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => resolve(r.id, "rejected")}>반려</Button>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">처리 완료</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

export function BoardsTab() {
  return (
    <>
      <SectionTitle title="게시판 관리" description="게시판 설정, 게시물, 신고를 한곳에서 다룹니다." />
      <SubTabs
        items={[
          { id: "boards", label: "게시판 목록", render: () => <BoardList /> },
          { id: "posts", label: "게시물 관리", render: () => <PostList /> },
          { id: "reports", label: "신고 처리", render: () => <ReportList /> },
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 권한 ─────────────────────────── */

function PermissionMatrix() {
  const [matrix, setMatrix] = useState(initialPermissionMatrix);
  const toggle = (role: KitRole, index: number) => setMatrix((m) => ({ ...m, [role]: m[role].map((v, i) => (i === index ? !v : v)) }));

  return (
    <>
      <p className="text-sm text-muted-foreground">칸을 눌러 역할별 권한을 켜고 끕니다. MASTER는 항상 모든 권한을 가집니다.</p>
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>권한</TableHead>
              {KIT_ROLES.map((r) => <TableHead key={r} className="text-center">{r}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((perm, i) => (
              <TableRow key={perm}>
                <TableCell className="font-medium">{perm}</TableCell>
                {KIT_ROLES.map((role) => {
                  const on = matrix[role][i];
                  const locked = role === "MASTER";
                  return (
                    <TableCell key={role} className="text-center">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-label={`${role} ${perm}`}
                        disabled={locked}
                        onClick={() => toggle(role, i)}
                        className="inline-grid size-8 place-items-center rounded-lg outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        {on ? <Check className="size-4 text-brand" /> : <Minus className="size-4 text-muted-foreground/60" />}
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}

function AdminAccounts() {
  const [accounts, setAccounts] = useState(initialAdminAccounts);
  const [email, setEmail] = useState("");

  const add = () => {
    const value = email.trim();
    if (!value.includes("@")) return toast.error("이메일 형식을 확인하세요.");
    if (accounts.some((a) => a.email === value)) return toast.error("이미 관리자입니다.");
    setAccounts((list) => [...list, { id: Date.now(), name: value.split("@")[0], email: value, lastLogin: "-" }]);
    setEmail("");
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="관리자로 추가할 회원 이메일" aria-label="관리자 이메일" className="min-w-48 flex-1" />
        <Button type="button" variant="outline" onClick={add}><Plus /> 관리자 추가</Button>
      </div>
      <Panel className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>마지막 로그인</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="text-muted-foreground">{a.email}</TableCell>
                <TableCell className="tabular-nums">{a.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={accounts.length === 1}
                    onClick={() => setAccounts((list) => list.filter((x) => x.id !== a.id))}
                  >
                    해제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      {accounts.length === 1 && <p className="text-xs text-muted-foreground">마지막 관리자는 해제할 수 없습니다.</p>}
    </>
  );
}

export function PermissionsTab() {
  return (
    <>
      <SectionTitle title="권한 관리" description="역할마다 할 수 있는 일을 정하고 관리자 계정을 다룹니다." />
      <SubTabs
        items={[
          { id: "roles", label: "역할별 권한", render: () => <PermissionMatrix /> },
          { id: "admins", label: "관리자 계정", render: () => <AdminAccounts /> },
        ]}
      />
    </>
  );
}
