from __future__ import annotations

import io
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

SUPPORTED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


def validate_upload(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file was provided.')

    original_name = Path(file.filename).name
    if not original_name or Path(original_name).suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
        raise HTTPException(status_code=400, detail='Unsupported file type. Use JPG, PNG, or WEBP.')

    if file.content_type not in settings.allowed_upload_types:
        raise HTTPException(status_code=400, detail='Unsupported file type. Use JPG, PNG, or WEBP.')

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail='The uploaded file is empty.')
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail='File exceeds the configured upload limit.')

    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            if image.width <= 0 or image.height <= 0:
                raise ValueError('Image dimensions are invalid.')
            if image.width > settings.max_image_dimension or image.height > settings.max_image_dimension:
                raise HTTPException(status_code=413, detail='Image dimensions exceed the configured limit.')
            if image.format not in {'JPEG', 'PNG', 'WEBP'}:
                raise HTTPException(status_code=400, detail='Unsupported image format.')
    except (UnidentifiedImageError, OSError, ValueError, HTTPException):
        raise HTTPException(status_code=422, detail='The uploaded file is not a readable image.') from None
    finally:
        file.file.seek(0)


def save_upload(file: UploadFile) -> Path:
    validate_upload(file)
    suffix = Path(file.filename).suffix.lower() or '.png'
    destination = settings.upload_root / f'{uuid4().hex}{suffix}'
    with destination.open('wb') as buffer:
        while chunk := file.file.read(1024 * 1024):
            buffer.write(chunk)
    file.file.seek(0)
    return destination
