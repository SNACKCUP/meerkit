"""성별은 공통코드 MEERKIT_GENDER 값만 저장합니다 (마이그레이션 3e4ad6f5c06a 가 묶음을 넣음)."""

from sqlalchemy import select

from app.codes import list_codes
from app.codes.models import Code
from app.users.models import User


def test_gender_group_seeded(db):
    codes = list_codes(db, "MEERKIT_GENDER")
    assert [(c.code, c.label) for c in codes] == [("MALE", "남성"), ("FEMALE", "여성"), ("NONE", "선택안함")]


def test_signup_stores_code_and_accepts_old_lowercase(signup, db):
    assert signup("user01", gender="FEMALE").status_code == 201
    assert signup("user02", gender="male").status_code == 201  # 옛 화면이 보낸 소문자도 대문자로 맞춤
    genders = dict(db.execute(select(User.login_id, User.gender).where(User.login_id.in_(["user01", "user02"]))).all())
    assert genders == {"user01": "FEMALE", "user02": "MALE"}


def test_signup_rejects_unknown_gender(signup):
    response = signup("user01", gender="other")
    assert response.status_code == 400 and response.json()["code"] == "INVALID_CODE"


def test_profile_update_checks_gender(client, make_user, login):
    make_user("user01")
    headers = login("user01")
    assert client.patch("/api/users/me", headers=headers, json={"gender": "NONE"}).json()["gender"] == "NONE"
    bad = client.patch("/api/users/me", headers=headers, json={"gender": "X"})
    assert bad.status_code == 400 and bad.json()["code"] == "INVALID_CODE"
    assert client.patch("/api/users/me", headers=headers, json={"gender": None}).json()["gender"] is None  # 지우기


def test_inactive_code_cannot_be_chosen(signup, db):
    db.get(Code, ("MEERKIT_GENDER", "NONE")).is_active = False  # MASTER 가 값을 끈 경우
    db.flush()
    response = signup("user01", gender="NONE")
    assert response.status_code == 400 and response.json()["code"] == "INVALID_CODE"


def test_public_group_readable_before_login(client):
    body = client.get("/api/codes/MEERKIT_GENDER").json()  # 가입 화면은 로그인 전에 읽음
    assert [c["code"] for c in body["codes"]] == ["MALE", "FEMALE", "NONE"]


def test_private_group_still_needs_login(client):
    assert client.get("/api/codes").status_code == 401  # 목록은 로그인 필요
    assert client.get("/api/codes/NOPE_GROUP").status_code == 401  # 없는 묶음도 로그인 전에는 401 (있는지 알려 주지 않음)
