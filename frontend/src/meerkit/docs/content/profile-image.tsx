"use client";

import { useState } from "react";

import { ProfileImageField } from "../../auth/components/ProfileImageField";
import { Callout, CodeBlock, H2, Ic, P, Preview, PropsTable } from "../ui";

function Demo() {
  // 서버 없이 동작을 보여 주려고 올리는 대신 브라우저 안에서 주소만 만든다
  const [avatar, setAvatar] = useState<string | null>(null);
  return (
    <ProfileImageField
      user={{ name: "김미어", nickname: null, avatar_url: avatar }}
      onUpload={(file) => setAvatar(URL.createObjectURL(file))}
      onRemove={() => setAvatar(null)}
    />
  );
}

export function ProfileImageDoc() {
  return (
    <>
      <P>
        프로필 이미지를 고르고 바꾸는 입력 부품입니다. 사진이나 [이미지 변경]을
        누르면 파일 선택 창이 열리고, 올리는 동안 고른 사진을 미리 보여 줍니다.
        형식(JPG·PNG·WEBP)과 크기(기본 2MB)는 올리기 전에 이 부품이 먼저
        확인합니다.
      </P>
      <H2>미리보기</H2>
      <Preview
        code={`<ProfileImageField user={user} onUpload={upload} onRemove={remove} />`}
      >
        <Demo />
      </Preview>
      <H2>사용하기</H2>
      <CodeBlock
        title="src/app/(meerkit)/me/page.tsx 등"
        code={`import { ProfileImageField } from "@/meerkit";

<ProfileImageField
  user={user}
  onUpload={(file) => upload.mutateAsync(file)}   // 실패하면 throw → 오류 문구가 보입니다
  onRemove={() => remove.mutateAsync()}           // 주면 [삭제] 버튼이 생깁니다
/>`}
      />
      <PropsTable
        rows={[
          [
            "user",
            "{ name; nickname; avatar_url }",
            "지금 보여 줄 사용자. 이미지가 없으면 이니셜이 보입니다.",
            true,
          ],
          [
            "onUpload",
            "(file: File) => void | Promise",
            "고른 파일을 올리는 함수. 실패하면 throw 하세요.",
            true,
          ],
          [
            "onRemove",
            "() => void | Promise",
            "주면 이미지가 있을 때 [삭제] 버튼이 보입니다.",
          ],
          ["accept", "string[]", "허용하는 파일 형식. 기본 JPG·PNG·WEBP."],
          ["maxSizeMB", "number", "최대 크기(MB). 기본 2."],
          ["disabled", "boolean", "입력을 막습니다."],
          [
            "showHint",
            "boolean",
            'false면 "JPG, PNG, WEBP · 2MB 이하" 안내 문구를 숨깁니다. 형식이나 크기가 틀렸을 때의 오류 문구는 그대로 보입니다. 기본 true.',
          ],
        ]}
      />
      <H2>내 정보 화면을 서비스에 맞게 꾸미기</H2>
      <P>
        킷의 내 정보 화면(<Ic>MePage</Ic>)은 서비스 고유 설정을 끼우거나, 부분
        부품만 가져다 화면을 직접 짤 수 있습니다. 부품은 서버 호출까지 묶여
        있어서 <Ic>@/meerkit</Ic>에서 가져다 놓기만 하면 됩니다.
      </P>
      <CodeBlock
        title="src/app/(service)/mypage/view.tsx 등"
        code={`import { MePage, MeAvatarField, MeProfileForm, MePasswordForm, MeWithdrawForm } from "@/meerkit";

// ① 기본 화면에 서비스 탭을 앞에 끼우기
<MePage title="마이페이지" embedded extraTabs={[{ value: "api-key", label: "AI API 키", content: <ApiKeyInput /> }]} />

// ② 부품으로 화면을 직접 짜기 (로그인한 사용자에게만 그리세요)
<MeAvatarField showHint={false} />
<MeProfileForm />
<MePasswordForm />
<MeWithdrawForm />`}
      />
      <PropsTable
        rows={[
          ["title", "string", 'MePage 제목. 기본 "내 정보".'],
          [
            "extraTabs",
            "{ value; label; content }[]",
            "기본 탭(프로필 수정, 비밀번호 변경, 탈퇴) 앞에 끼울 탭. 첫 탭이 먼저 열립니다.",
          ],
          [
            "embedded",
            "boolean",
            "이미 <main> 안에 그려질 때 true. 바깥 <main>을 <div>로 바꿉니다.",
          ],
          [
            "apiKey",
            "boolean",
            'AI 서비스용 "API 키" 탭(ApiKeyInput)을 보입니다. 기본 true. AI를 쓰지 않거나 키 탭을 직접 꾸미는 서비스는 false.',
          ],
        ]}
      />
      <P>
        부품은 <Ic>MeAvatarField</Ic>(프로필 이미지), <Ic>MeNicknameForm</Ic>
        (닉네임, 설정에서 쓰지 않으면 아무것도 그리지 않음),{" "}
        <Ic>MeProfileForm</Ic>(이름·연락처·주소),
        <Ic>MePasswordForm</Ic>(비밀번호 변경), <Ic>MeWithdrawForm</Ic>(탈퇴)
        다섯 가지입니다.
      </P>
      <H2>서버와 연결</H2>
      <P>
        마이페이지(<Ic>/me</Ic>)는 이 부품을 <Ic>POST /users/me/avatar</Ic>
        (multipart, 필드명 <Ic>file</Ic>)와 <Ic>DELETE /users/me/avatar</Ic>에
        연결해 두었습니다. 두 요청 모두 <Ic>avatar_url</Ic>이 바뀐 내
        정보(User)를 돌려주면 화면이 바로 갱신됩니다.
      </P>
      <Callout tone="warn">
        파일을 실제로 저장하는 서버 구현(저장소, 주소 발급)은 킷에 포함되어 있지
        않습니다. 서비스 서버에서 위 두 API를 만들어 주세요. 만들기 전에는
        이미지 변경이 오류 문구로 끝납니다.
      </Callout>
    </>
  );
}
