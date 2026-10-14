from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import FabricAsset, ProjectVersion, TextileProject, User
from app.services.storage_service import save_upload, validate_upload


class ProjectCreatePayload(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    fabric_category: Optional[str] = None
    status: str = 'active'


class ProjectUpdatePayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fabric_category: Optional[str] = None
    status: Optional[str] = None


class ProjectVersionPayload(BaseModel):
    source_asset_id: Optional[int] = None
    output_asset_id: Optional[int] = None
    operation_type: str = 'reconstruction'
    parameters: Optional[dict] = None
    version_notes: Optional[str] = None


def serialize_project(project: TextileProject) -> dict:
    return {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'fabric_category': project.fabric_category,
        'status': project.status,
        'owner_id': project.user_id,
        'created_at': project.created_at.isoformat() if project.created_at else None,
        'updated_at': project.updated_at.isoformat() if project.updated_at else None,
        'active_version_id': project.active_version_id,
    }


def get_project_or_404(db: Session, project_id: int, user: User) -> TextileProject:
    project = db.get(TextileProject, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(status_code=404, detail='Project not found.')
    return project


def list_projects_for_user(db: Session, user: User) -> list[dict]:
    projects = db.execute(select(TextileProject).where(TextileProject.user_id == user.id).order_by(TextileProject.created_at.desc())).scalars().all()
    return [serialize_project(project) for project in projects]


def create_project(db: Session, user: User, payload: ProjectCreatePayload) -> TextileProject:
    project = TextileProject(
        user_id=user.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        fabric_category=payload.fabric_category.strip() if payload.fabric_category else None,
        status=payload.status or 'active',
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, user: User, project_id: int, payload: ProjectUpdatePayload) -> TextileProject:
    project = get_project_or_404(db, project_id, user)
    update_data = payload.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(project, key, value.strip() if isinstance(value, str) else value)
    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, user: User, project_id: int) -> None:
    project = get_project_or_404(db, project_id, user)
    db.delete(project)
    db.commit()


def list_project_images(db: Session, user: User, project_id: int) -> list[dict]:
    get_project_or_404(db, project_id, user)
    assets = db.execute(select(FabricAsset).where(FabricAsset.project_id == project_id).order_by(FabricAsset.created_at.desc())).scalars().all()
    return [{
        'id': asset.id,
        'project_id': asset.project_id,
        'asset_type': asset.asset_type,
        'original_name': asset.original_name,
        'mime_type': asset.mime_type,
        'file_size': asset.file_size,
        'width': asset.width,
        'height': asset.height,
        'created_at': asset.created_at.isoformat() if asset.created_at else None,
    } for asset in assets]


def get_image_asset(db: Session, user: User, project_id: int, image_id: int) -> FabricAsset:
    get_project_or_404(db, project_id, user)
    asset = db.get(FabricAsset, image_id)
    if asset is None or asset.project_id != project_id:
        raise HTTPException(status_code=404, detail='Image not found.')
    return asset


def add_image_to_project(db: Session, user: User, project_id: int, upload: UploadFile) -> FabricAsset:
    project = get_project_or_404(db, project_id, user)
    validate_upload(upload)
    path = save_upload(upload)
    try:
        asset = FabricAsset(
            project_id=project.id,
            asset_type='fabric_sample',
            original_name=Path(upload.filename or 'fabric.png').name,
            storage_key=str(path.relative_to(settings.upload_root)),
            mime_type=upload.content_type or 'application/octet-stream',
            file_size=path.stat().st_size,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
    except Exception:
        if path.exists():
            path.unlink(missing_ok=True)
        raise


def list_versions_for_project(db: Session, user: User, project_id: int) -> list[dict]:
    get_project_or_404(db, project_id, user)
    versions = db.execute(select(ProjectVersion).where(ProjectVersion.project_id == project_id).order_by(ProjectVersion.version_number.asc())).scalars().all()
    return [{
        'id': version.id,
        'project_id': version.project_id,
        'version_number': version.version_number,
        'operation_type': version.operation_type,
        'source_asset_id': version.source_asset_id,
        'output_asset_id': version.output_asset_id,
        'parameters': version.parameters,
        'version_notes': version.version_notes,
        'created_at': version.created_at.isoformat() if version.created_at else None,
    } for version in versions]


def get_version_for_project(db: Session, user: User, project_id: int, version_id: int) -> ProjectVersion:
    get_project_or_404(db, project_id, user)
    version = db.get(ProjectVersion, version_id)
    if version is None or version.project_id != project_id:
        raise HTTPException(status_code=404, detail='Version not found.')
    return version


def create_project_version(db: Session, user: User, project_id: int, payload: ProjectVersionPayload) -> ProjectVersion:
    project = get_project_or_404(db, project_id, user)
    current_versions = db.execute(select(ProjectVersion).where(ProjectVersion.project_id == project_id)).scalars().all()
    next_number = max((version.version_number for version in current_versions), default=0) + 1
    version = ProjectVersion(
        project_id=project.id,
        version_number=next_number,
        operation_type=payload.operation_type,
        source_asset_id=payload.source_asset_id,
        output_asset_id=payload.output_asset_id,
        parameters=payload.parameters,
        version_notes=payload.version_notes,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    project.active_version_id = version.id
    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()
    return version


def restore_version(db: Session, user: User, project_id: int, version_id: int) -> ProjectVersion:
    project = get_project_or_404(db, project_id, user)
    version = get_version_for_project(db, user, project_id, version_id)
    project.active_version_id = version.id
    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()
    db.refresh(project)
    return version
