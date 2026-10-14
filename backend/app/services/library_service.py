from datetime import datetime, timezone
from typing import Dict, List, Optional

PROJECT_STORE: List[Dict] = [
    {
        'id': 1,
        'title': 'Silk Study Collection',
        'description': 'Initial textile archive project.',
        'fabric_category': 'Banarasi',
        'status': 'active',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'favorite': False,
        'notes': 'Classic motif study.',
    }
]


def list_projects(search: Optional[str] = None) -> List[Dict]:
    if not search:
        return PROJECT_STORE
    query = search.lower()
    return [project for project in PROJECT_STORE if query in project['title'].lower() or query in (project.get('notes') or '').lower()]


def create_project(payload: dict) -> dict:
    project = {
        'id': max((item['id'] for item in PROJECT_STORE), default=0) + 1,
        'title': payload.get('title', 'Untitled project'),
        'description': payload.get('description', ''),
        'fabric_category': payload.get('fabric_category', 'Unknown'),
        'status': payload.get('status', 'active'),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'favorite': False,
        'notes': payload.get('notes', ''),
    }
    PROJECT_STORE.append(project)
    return project


def update_project(project_id: int, payload: dict) -> dict:
    for index, project in enumerate(PROJECT_STORE):
        if project['id'] == project_id:
            PROJECT_STORE[index].update(payload)
            PROJECT_STORE[index]['updated_at'] = datetime.now(timezone.utc).isoformat()
            return PROJECT_STORE[index]
    raise KeyError(project_id)


def get_project(project_id: int) -> dict:
    for project in PROJECT_STORE:
        if project['id'] == project_id:
            return project
    raise KeyError(project_id)


def delete_project(project_id: int) -> None:
    global PROJECT_STORE
    PROJECT_STORE = [project for project in PROJECT_STORE if project['id'] != project_id]


def add_version(project_id: int, version: dict) -> dict:
    project = get_project(project_id)
    project.setdefault('versions', []).append(version)
    return version


def toggle_favorite(project_id: int, favorite: bool) -> dict:
    project = get_project(project_id)
    project['favorite'] = favorite
    project['updated_at'] = datetime.now(timezone.utc).isoformat()
    return {'project_id': project_id, 'favorite': favorite}
