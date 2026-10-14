import numpy as np
from PIL import Image, ImageDraw

from reconstruction import (
    build_reconstruction_preview,
    detect_repeat_period,
    extract_reconstruction_tile,
)
from repeat_detection import _has_continuous_seam, estimate_repeat


def test_detect_repeat_period_for_repeating_pattern() -> None:
    tile_width, tile_height = 16, 20
    tile = Image.new("L", (tile_width, tile_height), color=255)
    draw = ImageDraw.Draw(tile)
    draw.rectangle((3, 5, 10, 14), fill=0)

    image = Image.new("L", (tile_width * 8, tile_height * 6))
    for y in range(0, image.height, tile_height):
        for x in range(0, image.width, tile_width):
            image.paste(tile, (x, y))

    detection = detect_repeat_period(image)

    assert detection.horizontal_period == tile_width
    assert detection.vertical_period == tile_height
    assert detection.horizontal_confidence >= 50
    assert detection.vertical_confidence >= 50


def test_detect_repeat_period_rejects_uniform_image() -> None:
    image = Image.new("L", (200, 200), color=128)

    detection = detect_repeat_period(image)

    assert detection.horizontal_period is None
    assert detection.vertical_period is None
    assert detection.horizontal_confidence == 0
    assert detection.vertical_confidence == 0


def test_detect_repeat_period_rejects_nonperiodic_gradient() -> None:
    image = Image.new("L", (256, 256))
    draw = ImageDraw.Draw(image)
    for y in range(image.height):
        draw.line((0, y, image.width - 1, y), fill=y)

    detection = detect_repeat_period(image)

    assert detection.horizontal_period is None
    assert detection.vertical_period is None


def test_detect_repeat_period_rejects_irregular_noise() -> None:
    noise = np.random.default_rng(42).integers(
        0, 256, size=(256, 256), dtype=np.uint8
    )
    image = Image.fromarray(noise)

    detection = detect_repeat_period(image)

    assert detection.horizontal_period is None
    assert detection.vertical_period is None


def test_detect_repeat_period_rejects_small_image() -> None:
    image = Image.new("RGB", (20, 20), "white")
    ImageDraw.Draw(image).line((0, 0, 19, 19), fill="black")

    detection = detect_repeat_period(image)

    assert detection.horizontal_period is None
    assert detection.vertical_period is None


def test_seam_check_uses_signed_pixel_differences() -> None:
    gray = np.tile(
        np.array([0, 0, 255, 255, 0, 0, 255, 255], dtype=np.uint8),
        (16, 1),
    )

    assert not _has_continuous_seam(gray, period=3, axis=1)


def test_detect_repeat_period_handles_localized_damage() -> None:
    tile_width, tile_height = 32, 24
    tile = Image.new("L", (tile_width, tile_height), color=230)
    ImageDraw.Draw(tile).rectangle((5, 4, 20, 18), fill=20)

    image = Image.new("L", (320, 240))
    for y in range(0, image.height, tile_height):
        for x in range(0, image.width, tile_width):
            image.paste(tile, (x, y))
    ImageDraw.Draw(image).rectangle((110, 60, 220, 180), fill=128)

    detection = detect_repeat_period(image)

    assert detection.horizontal_period == tile_width
    assert detection.vertical_period == tile_height


def test_detected_tile_can_be_previewed_before_repeating() -> None:
    image = Image.new("RGB", (64, 80), "white")
    ImageDraw.Draw(image).rectangle((2, 3, 13, 16), fill="black")

    tile = extract_reconstruction_tile(image, 16, 20)
    preview = build_reconstruction_preview(
        tile,
        (16, 20),
        output_size=(64, 80),
    )

    assert tile.size == (16, 20)
    assert preview.size == image.size
    assert tile.getpixel((2, 3)) == (0, 0, 0)
    assert preview.getpixel((2, 3)) == preview.getpixel((18, 3))


def test_repeated_preview_blends_seams_and_preserves_tile_interior() -> None:
    tile = Image.new("RGB", (32, 32), "white")
    draw = ImageDraw.Draw(tile)
    draw.rectangle((0, 0, 7, 31), fill="black")
    draw.rectangle((24, 0, 31, 31), fill="gray")
    draw.rectangle((0, 24, 31, 31), fill="blue")
    draw.rectangle((12, 12, 19, 19), fill="red")

    preview = build_reconstruction_preview(
        tile,
        (32, 32),
        direction="both",
        output_size=(64, 64),
    )
    pixels = np.asarray(preview)

    assert np.array_equal(pixels[:, 31], pixels[:, 32])
    assert np.array_equal(pixels[31, :], pixels[32, :])
    assert tuple(pixels[44, 44]) == tile.getpixel((12, 12))


def test_synthetic_repeating_pattern() -> None:
    tile_size = 32
    tile = Image.new("RGB", (tile_size, tile_size), "white")
    draw = ImageDraw.Draw(tile)
    draw.rectangle((4, 4, 15, 27), fill="black")

    image = Image.new("RGB", (256, 256), "white")
    for y in range(0, 256, tile_size):
        for x in range(0, 256, tile_size):
            image.paste(tile, (x, y))

    size, direction, confidence = estimate_repeat(image)

    assert size > 0
    assert direction in {"horizontal", "vertical"}
    assert confidence >= 50


def test_uniform_image_reports_no_detected_direction() -> None:
    image = Image.new("RGB", (200, 200), "gray")

    size, direction, confidence = estimate_repeat(image)

    assert size == 0
    assert direction == "unknown"
    assert confidence == 0


if __name__ == "__main__":
    test_synthetic_repeating_pattern()
