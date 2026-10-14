
from __future__ import annotations

import importlib
from pathlib import Path
from typing import BinaryIO, List

import numpy as np
from PIL import Image

from app.core.config import settings

OUTPUT_DIR = settings.output_root
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def save_uploaded_image(uploaded_file: BinaryIO, filename: str, output_dir: Path = OUTPUT_DIR) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(filename).name or 'fabric.png'
    destination = output_dir / safe_name
    counter = 1
    while destination.exists():
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix or '.png'
        destination = output_dir / f'{stem}_{counter}{suffix}'
        counter += 1

    with destination.open('wb') as buffer:
        while chunk := uploaded_file.read(1024 * 1024):
            buffer.write(chunk)
    return destination


def load_image(path: str | Path) -> Image.Image:
    with Image.open(path) as image:
        return image.convert('RGB')


def quantize_palette(image: Image.Image, num_colors: int = 5) -> List[str]:
    try:
        KMeans = importlib.import_module('sklearn.cluster').KMeans
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "scikit-learn is required for palette quantization. "
            "Install it with 'pip install scikit-learn'."
        ) from exc

    if num_colors < 1:
        raise ValueError('num_colors must be at least 1')

    sample = image.convert('RGB').copy()
    sample.thumbnail((200, 200))

    pixels = np.asarray(sample, dtype=np.uint8).reshape(-1, 3)
    if len(pixels) == 0:
        return []

    unique_pixels = np.unique(pixels, axis=0)
    k = min(num_colors, len(unique_pixels))
    if k == 0:
        return []

    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = model.fit_predict(pixels.astype(np.float32))

    counts = np.bincount(labels, minlength=k)
    order = np.argsort(counts)[::-1]

    palette: List[str] = []
    for index in order:
        r, g, b = np.clip(model.cluster_centers_[index], 0, 255).astype(int)
        palette.append(f'#{r:02x}{g:02x}{b:02x}')

    return palette
