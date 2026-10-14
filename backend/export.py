from __future__ import annotations

import json
from pathlib import Path


def export_results(payload: dict, export_path: Path) -> None:
    """Export fabric analysis results as a JSON file."""

    export_path.parent.mkdir(parents=True, exist_ok=True)
    with export_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
