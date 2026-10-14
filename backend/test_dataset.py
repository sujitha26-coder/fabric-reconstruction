from fastapi.testclient import TestClient

from app.core.config import settings
from main import app


client = TestClient(app)


def test_dataset_endpoint_reports_category_image_counts(tmp_path, monkeypatch):
    dataset_root = tmp_path / 'cleaned'
    (dataset_root / 'Banarasi' / 'subset').mkdir(parents=True)
    (dataset_root / 'Bandhani').mkdir()
    (dataset_root / 'Banarasi' / 'one.JPG').touch()
    (dataset_root / 'Banarasi' / 'subset' / 'two.png').touch()
    (dataset_root / 'Bandhani' / 'notes.txt').touch()
    monkeypatch.setattr(settings, 'dataset_root', dataset_root)

    response = client.get('/api/dataset')

    assert response.status_code == 200
    assert response.json() == {
        'categories': [
            {'name': 'Banarasi', 'image_count': 2},
            {'name': 'Bandhani', 'image_count': 0},
        ],
        'total_images': 2,
    }


def test_dataset_endpoint_reports_missing_directory(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'dataset_root', tmp_path / 'missing')

    response = client.get('/api/dataset')

    assert response.status_code == 503
    assert response.json()['detail'] == 'The configured dataset directory is unavailable.'
