from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from main import app

client = TestClient(app)


def test_root_returns_api_information():
    response = client.get('/')
    assert response.status_code == 200
    assert response.json() == {
        'name': 'Fabric Reconstruction API',
        'status': 'ok',
        'docs': '/docs',
        'health': '/health',
    }


def test_favicon_returns_no_content():
    response = client.get('/favicon.ico')
    assert response.status_code == 204


def test_health_check():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_upload_generates_analysis():
    image = Image.new('RGB', (200, 200), color=(120, 80, 60))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    response = client.post('/upload', files={'file': ('fabric.png', buffer.read(), 'image/png')})
    assert response.status_code == 200
    payload = response.json()
    assert 'filename' in payload
    assert payload['pattern']['tile_size'] is None
    assert payload['pattern']['direction'] == 'unknown'
    assert payload['pattern']['reliable'] is False
    assert isinstance(payload['palette'], list)
    assert payload['image_url'].startswith('/outputs/')
    assert payload['tile_preview_url'] is None
    preview_response = client.get(payload['image_url'])
    assert preview_response.status_code == 200
    preview = Image.open(BytesIO(preview_response.content))
    assert preview.size == image.size
    assert preview.getpixel((0, 0)) == image.getpixel((0, 0))


def test_upload_returns_detected_tile_preview_for_repeating_image():
    tile_size = 32
    tile = Image.new('RGB', (tile_size, tile_size), 'white')
    for x in range(4, 16):
        for y in range(4, 28):
            tile.putpixel((x, y), (0, 0, 0))
    image = Image.new('RGB', (256, 256), 'white')
    for y in range(0, image.height, tile_size):
        for x in range(0, image.width, tile_size):
            image.paste(tile, (x, y))

    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    response = client.post(
        '/upload',
        files={'file': ('repeating-fabric.png', buffer.read(), 'image/png')},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['pattern']['reliable'] is True
    assert payload['tile_preview_url'].startswith('/outputs/')

    tile_response = client.get(payload['tile_preview_url'])
    assert tile_response.status_code == 200
    tile_preview = Image.open(BytesIO(tile_response.content))
    assert tile_preview.size == (tile_size, tile_size)


def test_upload_rejects_invalid_image_content():
    response = client.post('/upload', files={'file': ('not-an-image.png', b'not an image', 'image/png')})
    assert response.status_code == 422
    assert response.json()['detail'] == 'The uploaded file is not a readable image.'


def test_quality_inspection_endpoint_returns_metrics():
    image = Image.new('RGB', (200, 200), color=(120, 80, 60))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    response = client.post('/api/quality/inspect', files={'file': ('quality.png', buffer.read(), 'image/png')})
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] in {'queued', 'complete'}
    assert 'metrics' in payload
    assert 'warnings' in payload
    inspection_id = payload['inspection_id']
    assert client.get(f'/api/quality/{inspection_id}').status_code == 200
    heatmap_response = client.get(f'/api/quality/{inspection_id}/heatmap')
    assert heatmap_response.status_code == 200
    assert heatmap_response.headers['content-type'].startswith('image/png')
    assert client.get('/api/quality/not-a-uuid').status_code == 404


def test_colorway_generation_endpoint_returns_palette():
    image = Image.new('RGB', (48, 48), color=(120, 50, 40))
    for x in range(24, 48):
        for y in range(48):
            image.putpixel((x, y), (30, 60, 120))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    response = client.post('/api/colorways/generate', data={
        'palette': '["#7B2D2D", "#D6A867", "#F4E9DE", "#3D2B2D"]',
        'strength': '0.8',
    }, files={'file': ('fabric.png', buffer.read(), 'image/png')})
    assert response.status_code == 200
    payload = response.json()
    assert payload['palette']
    assert payload['output']
    colorway_id = payload['colorway_id']
    assert client.get(f'/api/colorways/{colorway_id}').status_code == 200
    preview_response = client.get(f'/api/colorways/{colorway_id}/preview')
    assert preview_response.status_code == 200
    assert preview_response.headers['content-type'].startswith('image/png')
    assert client.post(f'/api/colorways/{colorway_id}/save').json()['saved'] is True


def test_library_project_endpoints_work():
    create_response = client.post('/api/library/projects', json={
        'title': 'Silk Study',
        'description': 'Test project',
        'fabric_category': 'Banarasi',
        'status': 'active'
    })
    assert create_response.status_code == 200
    project = create_response.json()
    assert project['title'] == 'Silk Study'

    list_response = client.get('/api/library/projects')
    assert list_response.status_code == 200
    assert len(list_response.json()['items']) >= 1


def test_restoration_job_returns_processing_ticket():
    image = Image.new('RGB', (180, 180), color=(200, 180, 160))
    source_buffer = BytesIO()
    image.save(source_buffer, format='PNG')
    source_buffer.seek(0)
    mask = Image.new('L', (180, 180), color=0)
    for x in range(70, 110):
        for y in range(70, 110):
            mask.putpixel((x, y), 255)
    mask_buffer = BytesIO()
    mask.save(mask_buffer, format='PNG')
    mask_buffer.seek(0)

    response = client.post('/api/restoration/jobs', files={
        'file': ('restoration.png', source_buffer.read(), 'image/png'),
        'mask': ('mask.png', mask_buffer.read(), 'image/png'),
    })
    assert response.status_code == 200
    payload = response.json()
    assert 'job_id' in payload
    assert payload['status'] == 'complete'
    assert 'baseline' in payload['method']
    result = client.get(payload['result_url'])
    assert result.status_code == 200
    assert result.headers['content-type'].startswith('image/png')
    assert client.post(f"/api/restoration/jobs/{payload['job_id']}/approve").json()['status'] == 'approved'
