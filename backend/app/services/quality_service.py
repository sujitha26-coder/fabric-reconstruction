from __future__ import annotations

from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings


def _safe_path(name: str) -> Path:
    return settings.output_root / f"quality_{name}.png"


def inspect_quality(image: Image.Image, filename: str = 'fabric') -> dict:
    rgb = np.array(image.convert('RGB'))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    height, width = gray.shape
    laplacian = cv2.Laplacian(gray, cv2.CV_32F)
    sharpness = float(laplacian.var())
    contrast = float(gray.std())
    brightness = float(gray.mean())
    warnings: list[str] = []

    if width < 1200 or height < 1200:
        warnings.append('Image resolution is below the recommended textile detail threshold.')
    if sharpness < 50:
        warnings.append('The image appears blurred or soft; fine weave details may be harder to reconstruct.')
    if contrast < 25:
        warnings.append('Low contrast may reduce boundary visibility for motifs and weave repeats.')
    if brightness < 40 or brightness > 220:
        warnings.append('Exposure may be extreme and could obscure textile texture details.')

    local_sharpness = cv2.boxFilter(laplacian * laplacian, -1, (31, 31), normalize=True)
    gray_float = gray.astype(np.float32)
    local_mean = cv2.boxFilter(gray_float, -1, (31, 31), normalize=True)
    local_mean_squared = cv2.boxFilter(gray_float * gray_float, -1, (31, 31), normalize=True)
    local_contrast = np.sqrt(np.maximum(local_mean_squared - local_mean * local_mean, 0))
    sharpness_scale = max(float(np.percentile(local_sharpness, 95)), 1.0)
    contrast_scale = max(float(np.percentile(local_contrast, 95)), 1.0)
    local_quality = np.clip(
        0.7 * (local_sharpness / sharpness_scale) + 0.3 * (local_contrast / contrast_scale),
        0.0,
        1.0,
    )
    low_quality = 1.0 - local_quality
    heatmap = cv2.applyColorMap(np.uint8(low_quality * 255), cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    alpha = np.uint8(low_quality * 170)
    overlay = np.dstack((heatmap_rgb, alpha))
    heatmap_path = _safe_path(Path(filename).stem)
    heatmap_img = Image.fromarray(overlay, mode='RGBA')
    heatmap_img.save(heatmap_path)

    metrics = {
        'width': width,
        'height': height,
        'sharpness': round(float(sharpness), 4),
        'contrast': round(float(contrast), 4),
        'brightness': round(float(brightness), 4),
        'resolution_warning': width < 1200 or height < 1200,
        'blur_warning': sharpness < 50,
        'heatmap_kind': 'heuristic low-quality-region overlay',
        'method': 'local sharpness and contrast; not model-generated confidence'
    }

    return {
        'status': 'complete',
        'metrics': metrics,
        'warnings': warnings,
        'quality_metadata': {
            'source': 'measured image statistics and heuristic local overlay',
            'note': 'Sharpness, contrast, and brightness are image measurements. The overlay is heuristic only, not AI confidence or a validated damage detector.'
        },
        'heatmap_asset_id': heatmap_path.name,
    }


def inspect_quality_from_file(file_bytes: bytes, filename: str) -> dict:
    image = Image.open(BytesIO(file_bytes)).convert('RGB')
    return inspect_quality(image, filename)
