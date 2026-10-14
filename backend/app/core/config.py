import os
from pathlib import Path

from pydantic import BaseModel


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _load_dotenv() -> None:
    env_path = PROJECT_ROOT / '.env'
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = (part.strip() for part in line.split('=', 1))
        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        os.environ.setdefault(key, value)


_load_dotenv()


def _resolve_project_path(env_name: str, fallback: str) -> Path:
    raw_path = os.getenv(env_name, fallback)
    path = Path(raw_path)
    if not path.is_absolute():
        path = (PROJECT_ROOT / path).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


def _resolve_configured_path(env_name: str, fallback: str) -> Path:
    raw_path = os.getenv(env_name, fallback)
    path = Path(raw_path)
    if not path.is_absolute():
        path = (PROJECT_ROOT / path).resolve()
    return path


class Settings(BaseModel):
    app_name: str = os.getenv('APP_NAME', 'AI Fabric Reconstruction')
    app_env: str = os.getenv('APP_ENV', 'development')
    secret_key: str = os.getenv('SECRET_KEY') or ('dev-secret-key-change-me' if os.getenv('APP_ENV', 'development') != 'production' else '')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    jwt_issuer: str = os.getenv('JWT_ISSUER', 'weaveai')
    jwt_audience: str = os.getenv('JWT_AUDIENCE', 'weaveai-clients')
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '15'))
    refresh_token_expire_days: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))
    database_url: str = os.getenv('DATABASE_URL', 'sqlite:///./weaveai.db')
    max_upload_size_mb: int = int(os.getenv('MAX_FILE_SIZE_MB', '10'))
    max_image_dimension: int = int(os.getenv('MAX_IMAGE_DIMENSION', '15000'))
    allowed_upload_types: tuple[str, ...] = ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
    frontend_origins: tuple[str, ...] = tuple(os.getenv('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','))
    upload_root: Path = _resolve_project_path('UPLOAD_DIR', './uploads')
    output_root: Path = _resolve_project_path('OUTPUT_DIR', './outputs')
    dataset_root: Path = _resolve_configured_path('DATASET_DIR', '../dataset/cleaned')


settings = Settings()
if settings.app_env == 'production' and not settings.secret_key:
    raise RuntimeError('SECRET_KEY must be set in production.')
