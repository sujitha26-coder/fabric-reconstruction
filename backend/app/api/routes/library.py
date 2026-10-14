from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.library_service import create_project, delete_project, get_project, list_projects, toggle_favorite, update_project

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    fabric_category: Optional[str] = None
    status: str = 'active'
    notes: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fabric_category: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.post('/library/projects')
async def create_library_project(payload: ProjectCreate) -> dict:
    project = create_project(payload.model_dump())
    return project


@router.get('/library/projects')
async def list_library_projects(search: Optional[str] = None) -> dict:
    return {'items': list_projects(search), 'total': len(list_projects(search))}


@router.get('/library/projects/{project_id}')
async def get_library_project(project_id: int) -> dict:
    try:
        return get_project(project_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc


@router.patch('/library/projects/{project_id}')
async def patch_library_project(project_id: int, payload: ProjectUpdate) -> dict:
    try:
        return update_project(project_id, payload.model_dump(exclude_none=True))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc


@router.delete('/library/projects/{project_id}')
async def delete_library_project(project_id: int) -> dict:
    try:
        delete_project(project_id)
        return {'deleted': True, 'project_id': project_id}
    except Exception as exc:  # pragma: no cover - safety fallback
        raise HTTPException(status_code=500, detail='Unable to delete project.') from exc


@router.post('/library/projects/{project_id}/versions')
async def create_project_version(project_id: int, payload: dict) -> dict:
    try:
        project = get_project(project_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc

    version = {'version_number': len(project.get('versions', [])) + 1, **payload}
    project.setdefault('versions', []).append(version)
    return version


@router.get('/library/projects/{project_id}/versions')
async def list_project_versions(project_id: int) -> dict:
    try:
        project = get_project(project_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc

    return {'items': project.get('versions', [])}


@router.post('/library/projects/{project_id}/favorites')
async def favorite_project(project_id: int) -> dict:
    try:
        return toggle_favorite(project_id, True)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc


@router.delete('/library/projects/{project_id}/favorites')
async def unfavorite_project(project_id: int) -> dict:
    try:
        return toggle_favorite(project_id, False)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail='Project not found.') from exc
