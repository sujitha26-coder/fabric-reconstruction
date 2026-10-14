# AI-Based Fabric Weave Pattern Reconstruction

This project is a working local MVP for analyzing a small fabric sample, detecting a repeating pattern, extracting a palette, and reconstructing a larger textile preview. It follows a modular architecture suitable for a final-year academic demonstration and can be extended to a full production deployment with PostgreSQL, background jobs, and AI model training.

## 1. Architecture overview

The application is split into three layers:

- Frontend: React + Vite single-page app for upload, project management, preview, analysis summary, and classification display
- Backend: FastAPI REST API for file validation, processing, reconstruction, and export endpoints
- Data and storage: local filesystem for development, with schema design for PostgreSQL and future cloud storage integration

### High-level flow

1. User uploads a fabric image.
2. Backend validates file type, size, and dimensions.
3. Image preprocessing normalizes the sample and estimates repeat behavior.
4. Pattern analysis identifies likely tile size, direction, and dominant palette.
5. Reconstruction creates a seamless repeating preview.
6. Results are returned to the frontend, saved to disk, and exported as JSON metadata.

## 2. Directory structure

```text
Fabric Recontruction/
├── backend/
│   ├── __pycache__/
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── image_processing.py
│   ├── repeat_detection.py
│   ├── reconstruction.py
│   ├── export.py
│   ├── schema.sql
│   └── test_api.py
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── Dockerfile
├── uploads/
├── outputs/
├── dataset/
│   └── cleaned/
├── docker-compose.yml
├── .dockerignore
├── README.md
└── .gitignore
```

## 3. Database design

The project includes a PostgreSQL schema that is ready for extension. The schema supports:

- users
- user_roles
- projects
- uploaded_files
- reconstruction_jobs
- processing_results
- model_versions
- project_shares

Core tables:

- `users`: authentication and profile data
- `projects`: project metadata and ownership mapping
- `uploaded_files`: original and processed artifacts
- `reconstruction_jobs`: queue state and status tracking
- `processing_results`: tile size, palette, confidence, and output metadata
- `model_versions`: training and evaluation metadata

See [backend/schema.sql](backend/schema.sql) for the initial schema.

## 4. API surface

The MVP API currently includes:

- `GET /` — API landing information with links to the docs and health check
- `GET /health` — health check
- `GET /api/dataset` — list cleaned dataset categories and image counts
- `POST /upload` — upload image and run baseline repeat analysis
- `GET /outputs/{filename}` — served static output image route under the FastAPI static mount

Planned production endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /projects`
- `POST /projects`
- `GET /projects/{id}`
- `DELETE /projects/{id}`
- `POST /projects/{id}/analyze`
- `POST /projects/{id}/reconstruct`
- `GET /admin/analytics`

## 5. Implementation plan

1. Define architecture and API contracts.
2. Create project structure and configuration files.
3. Build frontend upload and preview dashboard.
4. Implement backend preprocessing and repeat detection.
5. Add reconstruction and export pipeline.
6. Validate with automated tests.
7. Containerize for local deployment.

## 6. Running locally

### Cleaned fabric dataset

The backend can read the cleaned image folders directly from disk; the images do not
need to be copied into the frontend. Set `DATASET_DIR` in `backend/.env` to the
cleaned dataset root. For example:

```dotenv
DATASET_DIR="C:/Users/visha/Desktop/weave data/FinalFabric/cleaned"
```

The root should contain one folder per fabric category. `GET /api/dataset` reports
the number of supported image files found in each category. With Docker Compose,
`DATASET_HOST_DIR` selects the host folder; Compose mounts it read-only at
`/data/cleaned`.

### Backend

```bash
cd backend
py -3.9 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Use the project virtual environment to run the API:

```bash
.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On systems where `py -3.9` is unavailable, create `.venv` with an installed Python version supported by the backend dependencies. VS Code is configured to use `backend/.venv`; select that interpreter if prompted.

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open the frontend in the browser at:

```text
http://localhost:5173/
```

### VS Code Python support (Pylance)

Install the recommended VS Code extensions when prompted: Python and Pylance. Pylance is a VS Code extension, not a Python package, so do not add it to `backend/requirements.txt` or install it with `pip`.

If VS Code reports that Pylance is missing, open the Extensions view and confirm `ms-python.vscode-pylance` is enabled. Then run **Python: Select Interpreter** from the Command Palette and select the interpreter where the backend requirements are installed. Finally run **Developer: Reload Window**.

### Docker

```bash
docker-compose up --build
```

## 7. Technology choices

- FastAPI: lightweight API layer with clean validation and async support
- React + Vite: fast local development and simple deployment
- Pillow + NumPy + OpenCV: robust baseline image analysis and enhancement pipeline
- PostgreSQL: strong relational support for projects, users, and processing metadata
- Docker: portable local deployment and simpler cloud migration

## 8. Limitations and realistic note

This local MVP uses conventional image-processing heuristics rather than a trained generative model. That is intentional: it demonstrates a reliable baseline reconstruction flow without pretending a model has been trained when it has not. A production version would add a trained classifier or generative model with verified weights and curated textile datasets.

## 9. Testing

Run the backend test suite:

```bash
cd backend
pytest -q
```

## 10. Next production steps

- Integrate PostgreSQL with SQLAlchemy or SQLModel
- Add JWT auth and role checks
- Add Celery + Redis for asynchronous processing
- Add S3 storage integration
- Add model training pipeline and dataset documentation
- Add PDF/PNG export and admin analytics screens
