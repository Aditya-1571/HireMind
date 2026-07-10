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
DATABASE_URL=postgresql+psycopg://username:password@ep-example-123456.us-east-2.aws.neon.tech/hiremind?sslmode=require
```

## Endpoints

- `GET /api/health`
- `GET /api/health/database`
- `GET /docs`

## Database

Set `DATABASE_URL` to a Neon PostgreSQL connection string before running
database health checks or Alembic commands.

```bash
alembic current
```
