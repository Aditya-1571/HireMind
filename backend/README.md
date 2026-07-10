# HireMind Backend

Minimal FastAPI backend foundation for HireMind.

## Requirements

- Python 3.11 or newer
- pip

## Local Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment

Copy `.env.example` to `.env` when local overrides are needed.

```env
BACKEND_APP_NAME=HireMind API
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

## Endpoints

- `GET /api/health`
- `GET /docs`
