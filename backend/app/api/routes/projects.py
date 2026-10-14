from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.routes.auth import require_auth
from app.database import get_db
from app.models import User
from app.services.project_service import (
    ProjectCreatePayload,
    ProjectUpdatePayload,
    ProjectVersionPayload,
    add_image_to_project,
    create_project,
    create_project_version,
    delete_project,
    get_image_asset,
    get_project_or_404,
    get_version_for_project,
    list_project_images,
    list_projects_for_user,
    list_versions_for_project,
    restore_version,
    update_project,
)
from app.core.config import settings

router = APIRouter(prefix='/api')


@router.post('/projects')
async def create_pattern_project(payload: ProjectCreatePayload, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    project = create_project(db, current_user, payload)
    return {'project': {'id': project.id, 'title': project.title, 'description': project.description, 'status': project.status}}


@router.get('/projects')
async def list_pattern_projects(current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    return {'items': list_projects_for_user(db, current_user), 'total': len(list_projects_for_user(db, current_user))}


@router.get('/projects/{project_id}')
async def get_pattern_project(project_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id, current_user)
    return {'project': {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'fabric_category': project.fabric_category,
        'status': project.status,
        'owner_id': project.user_id,
        'created_at': project.created_at.isoformat() if project.created_at else None,
        'updated_at': project.updated_at.isoformat() if project.updated_at else None,
        'active_version_id': project.active_version_id,
    }}


@router.patch('/projects/{project_id}')
async def patch_pattern_project(project_id: int, payload: ProjectUpdatePayload, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    project = update_project(db, current_user, project_id, payload)
    return {'project': {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'fabric_category': project.fabric_category,
        'status': project.status,
    }}


@router.delete('/projects/{project_id}')
async def delete_pattern_project(project_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    delete_project(db, current_user, project_id)
    return {'deleted': True, 'project_id': project_id}


@router.post('/projects/{project_id}/images')
async def upload_project_image(project_id: int, file: UploadFile = File(...), current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    asset = add_image_to_project(db, current_user, project_id, file)
    return {'image': {
        'id': asset.id,
        'project_id': asset.project_id,
        'original_name': asset.original_name,
        'storage_key': asset.storage_key,
        'mime_type': asset.mime_type,
        'file_size': asset.file_size,
    }}


@router.get('/projects/{project_id}/images')
async def list_project_images_route(project_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    return {'items': list_project_images(db, current_user, project_id), 'total': len(list_project_images(db, current_user, project_id))}


@router.get('/projects/{project_id}/images/{image_id}')
async def get_project_image(project_id: int, image_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> FileResponse:
    asset = get_image_asset(db, current_user, project_id, image_id)
    storage_path = settings.upload_root / asset.storage_key
    if not storage_path.exists():
        raise HTTPException(status_code=404, detail='Image file not found.')
    return FileResponse(storage_path, media_type=asset.mime_type or 'application/octet-stream', filename=asset.original_name)


@router.get('/projects/{project_id}/versions')
async def list_project_versions(project_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    return {'items': list_versions_for_project(db, current_user, project_id), 'total': len(list_versions_for_project(db, current_user, project_id))}


@router.get('/projects/{project_id}/versions/{version_id}')
async def get_project_version(project_id: int, version_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    version = get_version_for_project(db, current_user, project_id, version_id)
    return {'version': {
        'id': version.id,
        'project_id': version.project_id,
        'version_number': version.version_number,
        'operation_type': version.operation_type,
        'source_asset_id': version.source_asset_id,
        'output_asset_id': version.output_asset_id,
        'parameters': version.parameters,
        'version_notes': version.version_notes,
        'created_at': version.created_at.isoformat() if version.created_at else None,
    }}


@router.post('/projects/{project_id}/versions')
async def create_pattern_version(project_id: int, payload: ProjectVersionPayload, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    version = create_project_version(db, current_user, project_id, payload)
    return {'version': {
        'id': version.id,
        'project_id': version.project_id,
        'version_number': version.version_number,
        'operation_type': version.operation_type,
        'source_asset_id': version.source_asset_id,
        'output_asset_id': version.output_asset_id,
        'version_notes': version.version_notes,
    }}


@router.post('/projects/{project_id}/versions/{version_id}/restore')
async def restore_pattern_version(project_id: int, version_id: int, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    version = restore_version(db, current_user, project_id, version_id)
    return {'restored': True, 'project_id': project_id, 'version_id': version.id}


@router.get('/admin/users')
async def list_admin_users(current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required.')
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {'items': [{
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    } for user in users], 'total': len(users)}


@router.patch('/admin/users/{user_id}/status')
async def update_admin_user_status(user_id: int, payload: dict, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required.')
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail='User not found.')
    target.is_active = bool(payload.get('is_active'))
    db.add(target)
    db.commit()
    return {'user_id': target.id, 'is_active': target.is_active}


@router.patch('/admin/users/{user_id}/role')
async def update_admin_user_role(user_id: int, payload: dict, current_user: User = Depends(require_auth), db: Session = Depends(get_db)) -> dict:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required.')
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail='User not found.')
    role = str(payload.get('role', target.role)).lower()
    if role not in {'designer', 'admin'}:
        raise HTTPException(status_code=400, detail='Role must be either designer or admin.')
    if target.id == current_user.id and role == 'admin':
        raise HTTPException(status_code=403, detail='You cannot promote yourself to admin.')
    target.role = role
    db.add(target)
    db.commit()
    return {'user_id': target.id, 'role': target.role}
