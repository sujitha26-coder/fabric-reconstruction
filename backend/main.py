from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from PIL import UnidentifiedImageError

from app.api.routes.auth import router as auth_router
from app.api.routes.colorways import router as colorways_router
from app.api.routes.dataset import router as dataset_router
from app.api.routes.library import router as library_router
from app.api.routes.projects import router as projects_router
from app.api.routes.quality import router as quality_router
from app.api.routes.restoration import router as restoration_router
from app.core.config import settings
from app.database import Base, engine
from app.services.storage_service import validate_upload
from export import export_results
from image_processing import OUTPUT_DIR, load_image, quantize_palette, save_uploaded_image
from reconstruction import (
    build_reconstruction_preview,
    extract_reconstruction_tile,
)
from repeat_detection import detect_repeat_period

Base.metadata.create_all(bind=engine)

app = FastAPI(title='Fabric Reconstruction API')
app.mount('/outputs', StaticFiles(directory=str(OUTPUT_DIR)), name='outputs')

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(quality_router, prefix='/api')
app.include_router(colorways_router, prefix='/api')
app.include_router(dataset_router, prefix='/api')
app.include_router(library_router, prefix='/api')
app.include_router(projects_router)
app.include_router(restoration_router, prefix='/api')


@app.get('/')
def api_root() -> dict[str, str]:
    return {
        'name': app.title,
        'status': 'ok',
        'docs': '/docs',
        'health': '/health',
    }


@app.get('/favicon.ico', include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


@app.get('/health')
def health_check() -> dict:
    return {'status': 'ok'}


@app.post('/upload')
async def upload_image(file: UploadFile = File(...)) -> dict:
    validate_upload(file)
    file_path = save_uploaded_image(file.file, file.filename or 'fabric.png')
    try:
        image = load_image(file_path)
    except (UnidentifiedImageError, OSError, ValueError) as error:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail='The uploaded file is not a readable image.') from error

    detection = detect_repeat_period(image)
    horizontal_period = detection.horizontal_period
    vertical_period = detection.vertical_period
    periods = [
        period
        for period in (horizontal_period, vertical_period)
        if period is not None
    ]

    if horizontal_period is not None and vertical_period is not None:
        direction = 'both'
        confidence = min(
            detection.horizontal_confidence,
            detection.vertical_confidence,
        )
    elif horizontal_period is not None:
        direction = 'horizontal'
        confidence = detection.horizontal_confidence
    elif vertical_period is not None:
        direction = 'vertical'
        confidence = detection.vertical_confidence
    else:
        direction = 'unknown'
        confidence = max(
            detection.horizontal_confidence,
            detection.vertical_confidence,
        )

    tile_width = horizontal_period or image.width
    tile_height = vertical_period or image.height
    has_reliable_repeat = bool(periods)
    tile_size = periods[0] if len(periods) == 1 else None
    palette = quantize_palette(image, num_colors=5)

    preview_dir = OUTPUT_DIR
    preview_path = preview_dir / f'reconstructed_{file_path.stem}.png'
    tile_preview_path = preview_dir / f'repeat_tile_{file_path.stem}.png'
    if has_reliable_repeat:
        tile = extract_reconstruction_tile(image, tile_width, tile_height)
        tile.save(tile_preview_path)
        build_reconstruction_preview(
            tile,
            (tile_width, tile_height),
            direction=direction,
            output_size=image.size,
        ).save(preview_path)
    else:
        image.convert('RGB').save(preview_path)

    export_payload = {
        'filename': file.filename,
        'pattern': {
            'tile_size': tile_size,
            'tile_dimensions': {
                'width': horizontal_period,
                'height': vertical_period,
            },
            'direction': direction,
            'confidence': round(confidence, 2),
            'horizontal_confidence': detection.horizontal_confidence,
            'vertical_confidence': detection.vertical_confidence,
            'reliable': has_reliable_repeat,
        },
        'palette': palette,
        'image_url': f'/outputs/{preview_path.name}',
        'tile_preview_url': (
            f'/outputs/{tile_preview_path.name}'
            if has_reliable_repeat
            else None
        ),
    }

    export_results(export_payload, preview_dir / f'{file_path.stem}_analysis.json')

    return export_payload
