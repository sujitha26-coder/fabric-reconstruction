import json
import uuid
from io import BytesIO
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.services.colorway_service import generate_colorway
from app.services.storage_service import validate_upload

router = APIRouter()


@router.post('/colorways/generate')
async def create_colorway(
    file: UploadFile = File(...),
    palette: str = Form(...),
    strength: float = Form(0.8),
) -> dict:
    validate_upload(file)
    try:
        image = Image.open(BytesIO(await file.read())).convert('RGB')
        palette_values = json.loads(palette)
        if not isinstance(palette_values, list) or not all(isinstance(color, str) for color in palette_values):
            raise ValueError('Palette must be a JSON array of color strings.')
        colorway_id = str(uuid.uuid4())
        result = generate_colorway(image, palette_values, strength, colorway_id)
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=422, detail='The uploaded file is not a readable image.') from error
    except (json.JSONDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    record = {
        'colorway_id': colorway_id,
        'source_asset_id': file.filename,
        'palette': result['palette'],
        'source_palette': result['source_palette'],
        'output': {
            'name': f'colorway-{colorway_id}',
            'preview_url': f'/api/colorways/{colorway_id}/preview',
            'status': 'complete',
            'method': 'baseline CIELAB palette mapping with source luminance preserved',
        },
        'processing_parameters': result['processing_parameters'],
        'saved': False,
    }
    _record_path(colorway_id).write_text(json.dumps(record), encoding='utf-8')
    return record


@router.get('/colorways/presets')
async def get_presets() -> dict:
    return {
        'presets': [
            {'name': 'Royal Maroon', 'palette': ['#7B2D2D', '#D6A867', '#F4E9DE', '#3D2B2D']},
            {'name': 'Heritage Gold', 'palette': ['#B27034', '#F9E7B1', '#F4E9DE', '#5F3B2F']},
            {'name': 'Indigo and Silver', 'palette': ['#1D3557', '#B0C4DE', '#E8EEF3', '#5A5A5A']},
            {'name': 'Ivory and Terracotta', 'palette': ['#F7F0E7', '#C86B4C', '#A55239', '#65473D']},
            {'name': 'Emerald and Antique Gold', 'palette': ['#0F5E3D', '#C9A767', '#E9E7DB', '#1F2E23']},
        ]
    }


def _record_path(colorway_id: str) -> Path:
    try:
        safe_id = str(uuid.UUID(colorway_id))
    except ValueError as error:
        raise HTTPException(status_code=404, detail='Colorway not found.') from error
    return settings.output_root / f'colorway_{safe_id}.json'


@router.get('/colorways/{colorway_id}')
async def get_colorway(colorway_id: str) -> dict:
    record_path = _record_path(colorway_id)
    if not record_path.is_file():
        raise HTTPException(status_code=404, detail='Colorway not found.')
    return json.loads(record_path.read_text(encoding='utf-8'))


@router.get('/colorways/{colorway_id}/preview')
async def get_colorway_preview(colorway_id: str) -> FileResponse:
    record_path = _record_path(colorway_id)
    preview_path = settings.output_root / f'colorway_{uuid.UUID(colorway_id)}.png'
    if not record_path.is_file() or not preview_path.is_file():
        raise HTTPException(status_code=404, detail='Colorway preview not found.')
    return FileResponse(preview_path, media_type='image/png', filename=f'colorway-{colorway_id}.png')


@router.post('/colorways/{colorway_id}/save')
async def save_colorway(colorway_id: str) -> dict:
    record_path = _record_path(colorway_id)
    if not record_path.is_file():
        raise HTTPException(status_code=404, detail='Colorway not found.')
    record = json.loads(record_path.read_text(encoding='utf-8'))
    record['saved'] = True
    record_path.write_text(json.dumps(record), encoding='utf-8')
    return {'colorway_id': colorway_id, 'saved': True}
