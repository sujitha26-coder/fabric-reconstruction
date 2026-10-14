from __future__ import annotations

from typing import NamedTuple, Tuple

import numpy as np
from PIL import Image


class RepeatDetection(NamedTuple):
    horizontal_period: int | None
    vertical_period: int | None
    horizontal_confidence: float
    vertical_confidence: float


def _has_continuous_seam(
    gray: np.ndarray,
    period: int,
    axis: int,
    max_seam_ratio: float = 1.75,
) -> bool:
    length = gray.shape[axis]
    if period < 2 or period >= length:
        return False

    if axis == 1:
        errors = [
            float(
                np.abs(
                    gray[:, start].astype(np.float32)
                    - gray[:, start + period - 1].astype(np.float32)
                ).mean()
            )
            for start in range(min(period, length - period + 1))
        ]
        typical_edge = float(
            np.abs(np.diff(gray.astype(np.float32), axis=1)).mean()
        )
    else:
        errors = [
            float(
                np.abs(
                    gray[start, :].astype(np.float32)
                    - gray[start + period - 1, :].astype(np.float32)
                ).mean()
            )
            for start in range(min(period, length - period + 1))
        ]
        typical_edge = float(
            np.abs(np.diff(gray.astype(np.float32), axis=0)).mean()
        )

    return bool(
        errors
        and typical_edge > 1e-8
        and min(errors) / typical_edge <= max_seam_ratio
    )


# Correlation must remain strong in all image bands so isolated folds or
# background details cannot make the whole image look periodic.
def _axis_repeat(
    gray: np.ndarray,
    axis: int,
    min_period: int,
    max_period: int,
    min_confidence: float,
) -> tuple[int | None, float]:
    length = gray.shape[axis]
    upper = min(max_period, length // 3)
    if upper < min_period:
        return None, 0.0

    scores: list[float] = []
    for lag in range(min_period, upper + 1):
        if axis == 1:
            first = gray[:, :-lag]
            second = gray[:, lag:]
        else:
            first = gray[:-lag, :]
            second = gray[lag:, :]

        first = first - first.mean()
        second = second - second.mean()
        denominator = float(
            np.sqrt(np.sum(first**2) * np.sum(second**2))
        )
        score = (
            float(np.sum(first * second) / denominator)
            if denominator > 1e-8
            else 0.0
        )
        scores.append(score)

    peaks = [
        index
        for index in range(1, len(scores) - 1)
        if scores[index] >= scores[index - 1]
        and scores[index] > scores[index + 1]
    ]
    if not peaks:
        return None, 0.0

    best_score = max(scores[index] for index in peaks)
    if best_score <= 0.15:
        return None, 0.0

    plausible_peaks = [
        index
        for index in peaks
        if scores[index] >= best_score * 0.95
    ]
    peak_index = min(plausible_peaks)
    peak_score = scores[peak_index]
    period = min_period + peak_index

    band_scores: list[float] = []
    band_edges = np.linspace(0, gray.shape[1 - axis], 5, dtype=int)
    for start, end in zip(band_edges[:-1], band_edges[1:]):
        if axis == 1:
            first = gray[start:end, :-period]
            second = gray[start:end, period:]
        else:
            first = gray[:-period, start:end]
            second = gray[period:, start:end]

        first = first - first.mean()
        second = second - second.mean()
        denominator = float(
            np.sqrt(np.sum(first**2) * np.sum(second**2))
        )
        band_scores.append(
            float(np.sum(first * second) / denominator)
            if denominator > 1e-8
            else 0.0
        )

    minimum_band_score = min(band_scores)
    if minimum_band_score < 0.35:
        return None, 0.0

    if axis == 1:
        seam_errors = [
            float(
                np.abs(
                    gray[:, start].astype(np.float32)
                    - gray[:, start + period - 1].astype(np.float32)
                ).mean()
            )
            for start in range(min(period, gray.shape[1] - period + 1))
        ]
        typical_edge = float(
            np.abs(np.diff(gray.astype(np.float32), axis=1)).mean()
        )
    else:
        seam_errors = [
            float(
                np.abs(
                    gray[start, :].astype(np.float32)
                    - gray[start + period - 1, :].astype(np.float32)
                ).mean()
            )
            for start in range(min(period, gray.shape[0] - period + 1))
        ]
        typical_edge = float(
            np.abs(np.diff(gray.astype(np.float32), axis=0)).mean()
        )

    if not seam_errors or typical_edge <= 1e-8:
        return None, 0.0
    seam_ratio = min(seam_errors) / typical_edge
    if seam_ratio > 1.75:
        return None, 0.0

    neighborhood = scores[
        max(0, peak_index - 5) : min(len(scores), peak_index + 6)
    ]
    background = [
        score
        for index, score in enumerate(
            scores[max(0, peak_index - 5) : min(len(scores), peak_index + 6)],
            start=max(0, peak_index - 5),
        )
        if abs(index - peak_index) > 2
    ]
    baseline = float(np.median(background or neighborhood))
    strength = float(np.clip((peak_score - 0.15) / 0.75, 0.0, 1.0))
    prominence = float(
        np.clip((peak_score - baseline) / 0.12, 0.0, 1.0)
    )
    confidence = round(strength * prominence * 100.0, 2)

    if peak_score <= 0.15 or confidence < min_confidence:
        return None, confidence

    return period, confidence


def detect_repeat_period(
    image: Image.Image,
    min_period: int = 8,
    max_period: int = 256,
    min_confidence: float = 50.0,
) -> RepeatDetection:
    """Estimate reliable horizontal and vertical repeat periods.

    Each period is returned in original-image pixels, or ``None`` when the
    corresponding axis has no sufficiently strong periodic match. Confidence
    is a heuristic correlation score, not a calibrated probability.
    """

    if min_period < 2:
        raise ValueError("min_period must be at least 2.")
    if max_period < min_period:
        raise ValueError("max_period must be at least min_period.")
    if not 0 <= min_confidence <= 100:
        raise ValueError("min_confidence must be between 0 and 100.")

    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    height, width = gray.shape
    original_gray = gray

    if width < 3 * min_period or height < 3 * min_period:
        return RepeatDetection(None, None, 0.0, 0.0)

    if float(gray.std()) < 2.5:
        return RepeatDetection(None, None, 0.0, 0.0)

    max_side = 512
    scale = min(1.0, max_side / max(height, width))
    if scale < 1.0:
        resized_width = max(3 * min_period, round(width * scale))
        resized_height = max(3 * min_period, round(height * scale))
        gray = np.asarray(
            Image.fromarray(gray).resize(
                (resized_width, resized_height),
                Image.Resampling.LANCZOS,
            ),
            dtype=np.uint8,
        )

    horizontal_period, horizontal_confidence = _axis_repeat(
        gray,
        axis=1,
        min_period=min_period,
        max_period=max_period,
        min_confidence=min_confidence,
    )
    vertical_period, vertical_confidence = _axis_repeat(
        gray,
        axis=0,
        min_period=min_period,
        max_period=max_period,
        min_confidence=min_confidence,
    )

    if horizontal_period is not None:
        horizontal_period = max(
            1,
            round(horizontal_period * width / gray.shape[1]),
        )
        if not _has_continuous_seam(
            original_gray,
            horizontal_period,
            axis=1,
        ):
            horizontal_period = None
            horizontal_confidence = 0.0
    if vertical_period is not None:
        vertical_period = max(
            1,
            round(vertical_period * height / gray.shape[0]),
        )
        if not _has_continuous_seam(
            original_gray,
            vertical_period,
            axis=0,
        ):
            vertical_period = None
            vertical_confidence = 0.0

    return RepeatDetection(
        horizontal_period,
        vertical_period,
        horizontal_confidence,
        vertical_confidence,
    )


def estimate_repeat(image: Image.Image) -> Tuple[int, str, float]:
    """Return the strongest reliable period for existing API callers."""

    detection = detect_repeat_period(image)
    candidates = [
        (
            detection.horizontal_period,
            "horizontal",
            detection.horizontal_confidence,
        ),
        (
            detection.vertical_period,
            "vertical",
            detection.vertical_confidence,
        ),
    ]
    reliable = [
        candidate
        for candidate in candidates
        if candidate[0] is not None
    ]
    if not reliable:
        confidence = max(
            detection.horizontal_confidence,
            detection.vertical_confidence,
        )
        return 0, "unknown", confidence

    period, direction, confidence = max(
        reliable,
        key=lambda candidate: candidate[2],
    )
    if period is None:
        return 0, "unknown", confidence
    return period, direction, confidence
