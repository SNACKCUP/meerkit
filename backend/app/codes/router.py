"""공통코드 조회 API: /api/codes (로그인한 사람 누구나, 켜진 값만). 화면의 드롭다운을 채울 때 씁니다.

is_public 인 묶음(예: MEERKIT_GENDER)은 로그인 전에도 GET /api/codes/{group_code} 로 읽을 수 있습니다 (가입 화면).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.codes import service
from app.codes.models import CodeGroup
from app.codes.schemas import OWNER_PATTERN, CodeGroupRead, CodeRead
from app.core.database import get_db
from app.core.principal import get_principal, require_login

router = APIRouter(prefix="/codes", tags=["codes"])


def _public(group: CodeGroup) -> CodeGroupRead:
    return CodeGroupRead(
        group_code=group.group_code,
        owner=group.owner,
        name=group.name,
        description=group.description,
        codes=[CodeRead.model_validate(code) for code in group.codes if code.is_active],
    )


@router.get(
    "",
    response_model=list[CodeGroupRead],
    summary="공통코드 목록 (켜진 묶음·값, owner 로 거르기)",
    dependencies=[Depends(require_login)],
)
def list_groups(
    owner: Annotated[str | None, Query(max_length=20, pattern=OWNER_PATTERN, description="예: SVC")] = None,
    db: Session = Depends(get_db),
):
    return [_public(group) for group in service.list_groups(db, owner=owner)]


@router.get(
    "/{group_code}",
    response_model=CodeGroupRead,
    summary="공통코드 묶음 하나 (켜진 값만). 공개 묶음은 로그인 없이",
)
def get_group(group_code: str, request: Request, db: Session = Depends(get_db)):
    if get_principal(request) is None and not service.is_public_group(db, group_code):
        require_login(request, None)  # 로그인 안 했고 공개 묶음도 아니면 401 (묶음이 있는지도 알려 주지 않음)
    return _public(service.get_active_group(db, group_code))
