"""meerkit gender codes

common_code_groups.is_public 칸을 더합니다 (true 면 로그인 전에도 GET /api/codes/{group_code} 로 읽음, 기본 false).
킷 첫 공통코드 묶음 MEERKIT_GENDER (성별) 을 넣고, users.gender 의 옛 소문자 값을 코드 값으로 바꿉니다.
- 코드: MALE 남성, FEMALE 여성, NONE 선택안함 (공통코드 code 는 대문자 CHECK 라 소문자 불가)
- 기존 값: male/female/none (대소문자·앞뒤 공백 무시) → MALE/FEMALE/NONE. 그 밖의 값은 목록에 없으므로 비웁니다
- MEERKIT_GENDER 는 is_public=true (가입 화면이 로그인 전에 목록을 읽음)
- 가입·내 정보 수정은 이 묶음으로 값을 검사합니다 (app.users.service, require_code)
downgrade: 대문자 값을 소문자로 되돌리고 묶음을 지운 뒤 (값은 CASCADE) is_public 칸을 지웁니다

Revision ID: 3e4ad6f5c06a
Revises: 08755ebea028
Create Date: 2026-11-17

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3e4ad6f5c06a"
down_revision: str | Sequence[str] | None = "08755ebea028"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

GROUP = "MEERKIT_GENDER"
CODES = [("MALE", "남성", 1), ("FEMALE", "여성", 2), ("NONE", "선택안함", 3)]


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "common_code_groups",
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.execute(
        sa.text(
            "INSERT INTO common_code_groups (group_code, owner, name, description, is_public) "
            "VALUES (:g, 'MEERKIT', '성별', '회원 성별 (가입·내 정보 선택 항목). users.gender 에 code 를 저장', true)"
        ).bindparams(g=GROUP)
    )
    for code, label, order in CODES:
        op.execute(
            sa.text(
                "INSERT INTO common_codes (group_code, code, label, sort_order) VALUES (:g, :c, :l, :o)"
            ).bindparams(g=GROUP, c=code, l=label, o=order)
        )
    op.execute("UPDATE users SET gender = upper(trim(gender)) WHERE lower(trim(gender)) IN ('male', 'female', 'none')")
    op.execute("UPDATE users SET gender = NULL WHERE gender IS NOT NULL AND gender NOT IN ('MALE', 'FEMALE', 'NONE')")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE users SET gender = lower(gender) WHERE gender IN ('MALE', 'FEMALE', 'NONE')")
    op.execute(sa.text("DELETE FROM common_code_groups WHERE group_code = :g").bindparams(g=GROUP))
    op.drop_column("common_code_groups", "is_public")
