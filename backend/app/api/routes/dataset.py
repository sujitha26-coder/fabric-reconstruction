from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.services.dataset_service import get_dataset_summary


router = APIRouter()


@router.get('/dataset')
def inspect_dataset() -> dict[str, object]:
    try:
        return get_dataset_summary(settings.dataset_root)
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail='The configured dataset directory is unavailable.',
        ) from error
