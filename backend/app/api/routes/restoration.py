from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.services.storage_service import validate_upload

router = APIRouter()


def _job_path(job_id: str) -> Path:
    try:
        safe_id = str(uuid.UUID(job_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail='Restoration job not found.') from error
    return settings.output_root / f'restoration_{safe_id}.json'


def _load_job(job_id: str) -> dict:
    path = _job_path(job_id)
    if not path.is_file():
        raise HTTPException(status_code=404, detail='Restoration job not found.')
    return json.loads(path.read_text(encoding='utf-8'))


def _save_job(job: dict) -> None:
    _job_path(job['job_id']).write_text(json.dumps(job), encoding='utf-8')


@router.post('/restoration/jobs')
async def create_restoration_job(
    file: UploadFile = File(...),
    mask: UploadFile = File(...),
    strength: float = Form(0.5),
) -> dict:
    validate_upload(file)
    validate_upload(mask)
    if not 0 <= strength <= 1:
        raise HTTPException(status_code=422, detail='Strength must be between 0 and 1.')
    job_id = str(uuid.uuid4())
    try:
        source = Image.open(BytesIO(await file.read())).convert('RGB')
        mask_image = Image.open(BytesIO(await mask.read())).convert('L')
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=422, detail='Source and mask must be readable images.') from error
    if source.size != mask_image.size:
        raise HTTPException(status_code=422, detail='The mask dimensions must match the source image.')

    mask_array = np.asarray(mask_image)
    binary_mask = np.where(mask_array >= 128, 255, 0).astype(np.uint8)
    if not np.any(binary_mask):
        raise HTTPException(status_code=422, detail='Paint at least one region on the restoration mask.')

    radius = 2.0 + strength * 6.0
    restored = cv2.inpaint(np.asarray(source), binary_mask, radius, cv2.INPAINT_TELEA)
    source_path = settings.output_root / f'restoration_{job_id}_source.png'
    mask_path = settings.output_root / f'restoration_{job_id}_mask.png'
    output_path = settings.output_root / f'restoration_{job_id}.png'
    source.save(source_path)
    mask_image.save(mask_path)
    Image.fromarray(restored).save(output_path)

    job = {
        'job_id': job_id,
        'status': 'complete',
        'source_name': Path(file.filename or 'fabric').name,
        'result_url': f'/api/restoration/jobs/{job_id}/result',
        'strength': strength,
        'approved': False,
        'method': 'OpenCV Telea inpainting baseline; masked pixels are synthesized and may not match the historical design.',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'version': 1,
    }
    _save_job(job)
    return job


@router.get('/restoration/jobs/{job_id}')
async def get_restoration_job(job_id: str) -> dict:
    return _load_job(job_id)


@router.post('/restoration/jobs/{job_id}/approve')
async def approve_restoration_job(job_id: str) -> dict:
    job = _load_job(job_id)
    job['approved'] = True
    job['approval_status'] = 'approved'
    _save_job(job)
    return {'job_id': job_id, 'status': 'approved'}


@router.post('/restoration/jobs/{job_id}/reject')
async def reject_restoration_job(job_id: str) -> dict:
    job = _load_job(job_id)
    job['approved'] = False
    job['approval_status'] = 'rejected'
    _save_job(job)
    return {'job_id': job_id, 'status': 'rejected'}


@router.get('/restoration/jobs/{job_id}/result')
async def restore_result(job_id: str) -> FileResponse:
    _load_job(job_id)
    output_path = settings.output_root / f'restoration_{uuid.UUID(job_id)}.png'
    if not output_path.is_file():
        raise HTTPException(status_code=404, detail='Restoration result not found.')
    return FileResponse(output_path, media_type='image/png', filename=f'restoration-{job_id}.png')


@router.post('/restoration/jobs/{job_id}/versions')
async def create_restoration_version(job_id: str) -> dict:
    job = _load_job(job_id)
    job['version'] += 1
    _save_job(job)
    return {'job_id': job_id, 'version': job['version'], 'saved': True}
