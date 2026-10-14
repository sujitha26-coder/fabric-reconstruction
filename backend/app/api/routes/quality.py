from __future__ import annotations

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.services.storage_service import validate_upload
from app.services.quality_service import inspect_quality_from_file

router = APIRouter()


@router.post('/quality/inspect')
async def inspect_quality(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file was provided.')

    validate_upload(file)
    content = await file.read()
    inspection_id = str(uuid.uuid4())
    try:
        result = inspect_quality_from_file(content, inspection_id)
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=422, detail='The uploaded file is not a readable image.') from error

    record = {
        'inspection_id': inspection_id,
        'status': result['status'],
        'metrics': result['metrics'],
        'warnings': result['warnings'],
        'quality_metadata': result['quality_metadata'],
        'heatmap_asset_id': result['heatmap_asset_id'],
        'heatmap_url': f'/api/quality/{inspection_id}/heatmap',
    }
    report_path = settings.output_root / f'quality_{inspection_id}.json'
    report_path.write_text(json.dumps(record), encoding='utf-8')
    return record


@router.get('/quality/{inspection_id}')
async def get_quality_inspection(inspection_id: str) -> dict:
    try:
        safe_id = str(uuid.UUID(inspection_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail='Quality inspection not found.') from error

    report_path = settings.output_root / f'quality_{safe_id}.json'
    if not report_path.is_file():
        raise HTTPException(status_code=404, detail='Quality inspection not found.')
    return json.loads(report_path.read_text(encoding='utf-8'))


@router.get('/quality/{inspection_id}/heatmap')
async def get_quality_heatmap(inspection_id: str) -> FileResponse:
    try:
        safe_id = str(uuid.UUID(inspection_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail='Quality heatmap not found.') from error

    heatmap_path = settings.output_root / f'quality_{safe_id}.png'
    if not heatmap_path.is_file():
        raise HTTPException(status_code=404, detail='Quality heatmap not found.')
    return FileResponse(heatmap_path, media_type='image/png', filename=f'quality-{safe_id}-overlay.png')
