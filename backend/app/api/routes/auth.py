from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RefreshToken, User
from app.services.auth_service import (
    authenticate_user,
    decode_token,
    get_authenticated_user,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    issue_tokens_for_user,
    normalize_email,
    purge_refresh_tokens,
    revoke_refresh_token,
    serialize_user,
    should_rate_limit,
)

router = APIRouter(prefix='/api/auth')


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: str = Field(pattern='^(designer|admin)$')


class UserStatusUpdate(BaseModel):
    is_active: bool


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


async def _ensure_login_rate_limit(request: Request) -> None:
    if should_rate_limit(request, limit=5, window_seconds=60):
        raise HTTPException(status_code=429, detail='Too many login attempts. Please try again later.')


@router.post('/register')
async def register_user(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> dict:
    email = normalize_email(payload.email)
    if get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail='An account with this email already exists.')

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role='designer',
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    tokens = issue_tokens_for_user(db, user)
    response.set_cookie(
        'refresh_token',
        tokens['refresh_token'],
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=7 * 24 * 60 * 60,
    )
    return {
        'user': serialize_user(user),
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token'],
        'token_type': 'bearer',
    }


@router.post('/login')
async def login_user(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    await _ensure_login_rate_limit(request)
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    tokens = issue_tokens_for_user(db, user)
    response.set_cookie(
        'refresh_token',
        tokens['refresh_token'],
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=7 * 24 * 60 * 60,
    )
    return {
        'user': serialize_user(user),
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token'],
        'token_type': 'bearer',
    }


@router.post('/refresh')
async def refresh_token(payload: RefreshRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    token = payload.refresh_token or request.cookies.get('refresh_token')
    if not token:
        raise HTTPException(status_code=401, detail='Refresh token is required.')

    decoded = decode_token(token, 'refresh')
    user = get_user_by_id(db, int(decoded['sub']))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail='Invalid refresh token.')

    record = db.query(RefreshToken).filter(RefreshToken.jti == decoded['jti']).first()
    if record is None or record.user_id != user.id or record.revoked_at is not None:
        raise HTTPException(status_code=401, detail='Refresh token has been revoked or is invalid.')

    if record.expires_at <= datetime.now(timezone.utc):
        record.revoked_at = datetime.now(timezone.utc)
        db.add(record)
        db.commit()
        raise HTTPException(status_code=401, detail='Refresh token has expired.')

    record.revoked_at = datetime.now(timezone.utc)
    db.add(record)
    db.commit()

    tokens = issue_tokens_for_user(db, user)
    response.set_cookie(
        'refresh_token',
        tokens['refresh_token'],
        httponly=True,
        secure=False,
        samesite='lax',
        max_age=7 * 24 * 60 * 60,
    )
    return {
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token'],
        'token_type': 'bearer',
        'user': serialize_user(user),
    }


@router.post('/logout')
async def logout_user(payload: LogoutRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    token = payload.refresh_token or request.cookies.get('refresh_token')
    if token:
        try:
            decoded = decode_token(token, 'refresh')
            user = get_user_by_id(db, int(decoded['sub']))
            if user is not None:
                record = db.query(RefreshToken).filter(RefreshToken.jti == decoded['jti']).first()
                if record is not None:
                    record.revoked_at = datetime.now(timezone.utc)
                    db.add(record)
                    db.commit()
                else:
                    purge_refresh_tokens(db, user.id)
        except HTTPException:
            pass
    response.delete_cookie('refresh_token', httponly=True, samesite='lax')
    return {'logged_out': True}


@router.get('/me')
async def get_current_user_profile(request: Request, db: Session = Depends(get_db)) -> dict:
    user = get_authenticated_user(request, db)
    return {'user': serialize_user(user)}


def require_auth(request: Request, db: Session = Depends(get_db)) -> User:
    return get_authenticated_user(request, db)


def require_admin(current_user: User = Depends(require_auth)) -> User:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required.')
    return current_user
