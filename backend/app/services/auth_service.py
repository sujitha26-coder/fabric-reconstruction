from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from argon2 import PasswordHasher
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models import RefreshToken, User

password_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32, salt_len=16)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        password_hasher.verify(password_hash, password)
        return True
    except Exception:
        return False


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def create_token(subject: str, token_type: str, *, expires_delta: timedelta) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    jti = str(uuid.uuid4())
    payload: dict[str, Any] = {
        'sub': str(subject),
        'jti': jti,
        'type': token_type,
        'iss': settings.jwt_issuer,
        'aud': settings.jwt_audience,
        'iat': int(now.timestamp()),
        'nbf': int(now.timestamp()),
        'exp': int((now + expires_delta).timestamp()),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, jti


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={'require': ['exp', 'iat', 'sub', 'iss', 'aud', 'jti', 'type']},
        )
    except jwt.PyJWTError as exc:  # pragma: no cover - defensive path
        raise HTTPException(status_code=401, detail='Invalid authentication token.') from exc

    if payload.get('type') != expected_type:
        raise HTTPException(status_code=401, detail='Invalid token type.')
    return payload


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == normalize_email(email)).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def serialize_user(user: User) -> dict[str, Any]:
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }


def purge_refresh_tokens(db: Session, user_id: int) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({'revoked_at': datetime.now(timezone.utc)})
    db.commit()


def revoke_refresh_token(db: Session, token: str, *, user_id: Optional[int] = None) -> None:
    payload = decode_token(token, 'refresh')
    if user_id is not None and int(payload['sub']) != user_id:
        raise HTTPException(status_code=401, detail='Token does not match user.')
    record = db.query(RefreshToken).filter(RefreshToken.jti == payload['jti']).first()
    if record is not None:
        record.revoked_at = datetime.now(timezone.utc)
        db.add(record)
        db.commit()


def issue_tokens_for_user(db: Session, user: User) -> dict[str, str]:
    access_token, _ = create_token(str(user.id), 'access', expires_delta=timedelta(minutes=settings.access_token_expire_minutes))
    refresh_token, jti = create_token(str(user.id), 'refresh', expires_delta=timedelta(days=settings.refresh_token_expire_days))
    token_record = RefreshToken(
        user_id=user.id,
        jti=jti,
        token_hash=_token_hash(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(token_record)
    db.commit()
    return {'access_token': access_token, 'refresh_token': refresh_token}


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not user.is_active:
        raise HTTPException(status_code=403, detail='Account is disabled.')
    if not verify_password(password, user.password_hash):
        return None
    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    return user


def token_from_request(request: Request) -> str:
    auth_header = request.headers.get('Authorization', '')
    if auth_header.lower().startswith('bearer '):
        return auth_header[7:]
    if request.headers.get('X-Access-Token'):
        return request.headers['X-Access-Token']
    raise HTTPException(status_code=401, detail='Authentication required.')


def get_authenticated_user(request: Request, db: Session) -> User:
    token = token_from_request(request)
    payload = decode_token(token, 'access')
    user = get_user_by_id(db, int(payload['sub']))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail='Invalid authentication token.')
    return user


def should_rate_limit(request: Request, *, limit: int = 5, window_seconds: int = 60) -> bool:
    client_ip = request.client.host if request.client else 'unknown'
    key = f'{client_ip}:{request.url.path}'
    bucket = request.state.rate_limiter if hasattr(request.state, 'rate_limiter') else {}
    now = datetime.now(timezone.utc).timestamp()
    entries = bucket.get(key, [])
    entries = [stamp for stamp in entries if now - stamp < window_seconds]
    entries.append(now)
    bucket[key] = entries
    request.state.rate_limiter = bucket
    return len(entries) > limit
