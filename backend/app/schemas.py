from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class QualityInspectionResult(BaseModel):
    inspection_id: str
    status: str
    metrics: Dict
    warnings: List[str]
    confidence_metadata: Dict
    heatmap_asset_id: Optional[str] = None


class ColorwayGenerationRequest(BaseModel):
    source_asset_id: str = Field(default='demo-source')
    palette: Optional[List[str]] = None
    strength: float = 0.8


class LibraryProjectCreate(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    fabric_category: Optional[str] = None
    status: str = 'active'
    notes: Optional[str] = None


class RestorationJobCreate(BaseModel):
    strength: float = 0.75
