from __future__ import annotations

import re
from pathlib import Path
from typing import Sequence

import cv2
import numpy as np
from PIL import Image, ImageColor

from app.core.config import settings


def _normalize_palette(palette: Sequence[str]) -> list[str]:
    if not 2 <= len(palette) <= 8:
        raise ValueError('Choose between 2 and 8 palette colors.')
    if any(not re.fullmatch(r'#[0-9a-fA-F]{6}', color) for color in palette):
        raise ValueError('Palette colors must use six-digit hexadecimal values.')
    return [color.lower() for color in palette]


def generate_colorway(
    source: Image.Image,
    palette: Sequence[str],
    strength: float,
    output_id: str,
) -> dict:
    if not 0 <= strength <= 1:
        raise ValueError('Strength must be between 0 and 1.')
    normalized_palette = _normalize_palette(palette)

    image = source.convert('RGB').copy()
    image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
    rgb = np.asarray(image)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    pixels = lab.reshape((-1, 3)).astype(np.float32)
    cluster_count = min(len(normalized_palette), len(pixels))
    sample = pixels[::max(1, len(pixels) // 20000)]
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, _, centers = cv2.kmeans(sample, cluster_count, None, criteria, 3, cv2.KMEANS_PP_CENTERS)

    source_order = np.argsort(centers[:, 0])
    target_rgb = np.asarray([ImageColor.getrgb(color) for color in normalized_palette], dtype=np.uint8)
    target_lab = cv2.cvtColor(target_rgb.reshape((1, -1, 3)), cv2.COLOR_RGB2LAB).reshape((-1, 3)).astype(np.float32)
    target_order = np.argsort(target_lab[:, 0])
    mapped_chroma = np.zeros((cluster_count, 2), dtype=np.float32)
    source_palette = []

    for rank, source_index in enumerate(source_order):
        target_index = target_order[rank]
        mapped_chroma[source_index] = target_lab[target_index, 1:]
        source_rgb = cv2.cvtColor(np.uint8([[centers[source_index, ::-1]]]), cv2.COLOR_LAB2RGB)[0, 0]
        source_palette.append('#%02x%02x%02x' % tuple(int(value) for value in source_rgb))

    output_pixels = np.empty_like(pixels)
    for start in range(0, len(pixels), 100000):
        end = min(start + 100000, len(pixels))
        chunk = pixels[start:end]
        distances = ((chunk[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        assignments = distances.argmin(axis=1)
        output_pixels[start:end, 0] = chunk[:, 0]
        output_pixels[start:end, 1:] = (
            chunk[:, 1:] * (1 - strength) + mapped_chroma[assignments] * strength
        )

    output_lab = np.clip(output_pixels.reshape(lab.shape), 0, 255).astype(np.uint8)
    output_rgb = cv2.cvtColor(output_lab, cv2.COLOR_LAB2RGB)
    output_path = settings.output_root / f'colorway_{output_id}.png'
    Image.fromarray(output_rgb).save(output_path)

    return {
        'palette': normalized_palette,
        'source_palette': source_palette,
        'output_path': output_path,
        'processing_parameters': {
            'strength': strength,
            'color_space': 'CIELAB',
            'mapping': 'rank-ordered dominant-color chroma mapping',
            'preserve_luminance': True,
            'preserve_texture': True,
            'max_output_dimension': 2048,
        },
    }
