
from __future__ import annotations

import numpy as np
from PIL import Image

from repeat_detection import (
    RepeatDetection,
    detect_repeat_period as _detect_repeat_period,
)


def detect_repeat_period(
    image: Image.Image,
    min_period: int = 8,
    max_period: int = 256,
    min_confidence: float = 50.0,
) -> RepeatDetection:
    """Expose the repeat detector alongside the reconstruction helpers."""

    return _detect_repeat_period(
        image,
        min_period=min_period,
        max_period=max_period,
        min_confidence=min_confidence,
    )


def extract_reconstruction_tile(
    source: Image.Image,
    tile_width: int,
    tile_height: int,
) -> Image.Image:
    """Crop a detected tile from the top-left of a source image."""

    source = source.convert("RGB")
    width, height = source.size

    if tile_width < 1 or tile_width > width:
        raise ValueError("tile_width must be within the source image.")
    if tile_height < 1 or tile_height > height:
        raise ValueError("tile_height must be within the source image.")

    gray = np.asarray(source.convert("L"), dtype=np.float32)
    horizontal_origin = 0
    if tile_width < width:
        horizontal_origin = min(
            range(min(tile_width, width - tile_width + 1)),
            key=lambda start: float(
                np.abs(
                    gray[:, start]
                    - gray[:, start + tile_width - 1]
                ).mean()
            ),
        )

    vertical_origin = 0
    if tile_height < height:
        vertical_origin = min(
            range(min(tile_height, height - tile_height + 1)),
            key=lambda start: float(
                np.abs(
                    gray[start, :]
                    - gray[start + tile_height - 1, :]
                ).mean()
            ),
        )

    return source.crop(
        (
            horizontal_origin,
            vertical_origin,
            horizontal_origin + tile_width,
            vertical_origin + tile_height,
        )
    )


def _blend_repeated_edges(
    tile: Image.Image,
    blend_horizontal: bool,
    blend_vertical: bool,
) -> Image.Image:
    """Feather repeat boundaries according to nearby texture contrast."""

    pixels = np.asarray(tile.convert("RGB"), dtype=np.float32).copy()
    height, width = pixels.shape[:2]

    if blend_horizontal:
        blend_width = min(8, width // 8)
        for distance in range(blend_width):
            alpha = 0.5 * (1.0 + np.cos(np.pi * distance / blend_width))
            left = pixels[:, distance, :].copy()
            right = pixels[:, width - 1 - distance, :].copy()
            left_inner = pixels[:, distance + 1, :]
            right_inner = pixels[:, width - 2 - distance, :]
            seam_contrast = np.abs(left - right).mean(axis=1)
            local_contrast = (
                np.abs(left - left_inner).mean(axis=1)
                + np.abs(right - right_inner).mean(axis=1)
            ) / 2.0
            edge_weight = seam_contrast / (
                seam_contrast + local_contrast + 1e-6
            )
            if distance == 0:
                edge_weight.fill(1.0)
            alpha_by_row = alpha * edge_weight[:, np.newaxis]
            average = (left + right) / 2.0
            pixels[:, distance, :] = (
                left * (1.0 - alpha_by_row) + average * alpha_by_row
            )
            pixels[:, width - 1 - distance, :] = (
                right * (1.0 - alpha_by_row) + average * alpha_by_row
            )

    if blend_vertical:
        blend_width = min(8, height // 8)
        for distance in range(blend_width):
            alpha = 0.5 * (1.0 + np.cos(np.pi * distance / blend_width))
            top = pixels[distance, :, :].copy()
            bottom = pixels[height - 1 - distance, :, :].copy()
            top_inner = pixels[distance + 1, :, :]
            bottom_inner = pixels[height - 2 - distance, :, :]
            seam_contrast = np.abs(top - bottom).mean(axis=1)
            local_contrast = (
                np.abs(top - top_inner).mean(axis=1)
                + np.abs(bottom - bottom_inner).mean(axis=1)
            ) / 2.0
            edge_weight = seam_contrast / (
                seam_contrast + local_contrast + 1e-6
            )
            if distance == 0:
                edge_weight.fill(1.0)
            alpha_by_column = alpha * edge_weight[:, np.newaxis]
            average = (top + bottom) / 2.0
            pixels[distance, :, :] = (
                top * (1.0 - alpha_by_column) + average * alpha_by_column
            )
            pixels[height - 1 - distance, :, :] = (
                bottom * (1.0 - alpha_by_column) + average * alpha_by_column
            )

    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))


def build_reconstruction_preview(
    source: Image.Image,
    tile_size: int | tuple[int, int],
    direction: str = "both",
    output_size: tuple[int, int] | None = None,
) -> Image.Image:
    """Create a repeated fabric preview with softened tile boundaries.

    This is classical image processing, not AI-generated reconstruction.
    """

    source = source.convert("RGB")
    width, height = source.size

    if width < 1 or height < 1:
        raise ValueError("Source image must not be empty.")
    if direction not in {"horizontal", "vertical", "both", "unknown"}:
        raise ValueError(
            "direction must be horizontal, vertical, both, or unknown"
        )

    if isinstance(tile_size, tuple):
        tile_width, tile_height = tile_size
    elif tile_size < 1:
        raise ValueError("tile_size must be positive.")
    elif direction == "horizontal":
        tile_size = min(tile_size, width)
        tile_width, tile_height = tile_size, height
    elif direction == "vertical":
        tile_size = min(tile_size, height)
        tile_width, tile_height = width, tile_size
    else:
        tile_size = min(tile_size, max(width, height))
        tile_width = min(tile_size, width)
        tile_height = min(tile_size, height)

    tile = extract_reconstruction_tile(source, tile_width, tile_height)
    tile = _blend_repeated_edges(
        tile,
        blend_horizontal=direction in {"horizontal", "both", "unknown"},
        blend_vertical=direction in {"vertical", "both", "unknown"},
    )

    if output_size is None:
        output_width, output_height = width, height
    else:
        output_width, output_height = output_size

    if output_width < 1 or output_height < 1:
        raise ValueError("Output dimensions must be positive.")

    output = Image.new("RGB", (output_width, output_height))

    for y in range(0, output_height, tile_height):
        for x in range(0, output_width, tile_width):
            output.paste(tile, (x, y))

    return output


def save_reconstruction_preview(
    source: Image.Image,
    tile_size: int | tuple[int, int],
    output_path,
    direction: str = "both",
    output_size: tuple[int, int] | None = None,
) -> None:
    preview = build_reconstruction_preview(
        source=source,
        tile_size=tile_size,
        direction=direction,
        output_size=output_size,
    )
    preview.save(output_path)
