# HireMind Backend

FastAPI backend for HireMind authentication, resume parsing and analysis,
interview generation, answer evaluation, analytics, reports, profile settings,
and health checks.

## Requirements

- Python 3.11 or newer
- pip

## Local Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` when local overrides are needed.

```env
BACKEND_APP_NAME=HireMind API
BACKEND_APP_ENV=development
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
BACKEND_TRUSTED_HOSTS=["localhost","127.0.0.1","testserver"]
DATABASE_URL=postgresql+psycopg://username:password@ep-example-123456.us-east-2.aws.neon.tech/hiremind?sslmode=require
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_EXPIRE_MINUTES=1440
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:1.5b
OLLAMA_TIMEOUT_SECONDS=60
```

The backend also accepts selected `BACKEND_`-prefixed aliases where configured
in `app/config.py`, such as `BACKEND_DATABASE_URL`,
`BACKEND_SESSION_SECRET`, and `BACKEND_OLLAMA_MODEL`.

Do not commit real `.env` files or secret values.

## Endpoints

- `GET /api/health`
- `GET /api/health/database`
- `GET /docs`

Feature endpoints are grouped under `/api/auth`, `/api/resumes`,
`/api/interviews`, `/api/profile`, and `/api/ai`.

## Database

Set `DATABASE_URL` to a Neon PostgreSQL connection string before running
database health checks or Alembic commands.

```bash
alembic upgrade head
alembic current
```

## Development Server

```bash
uvicorn app.main:app --reload
```

## Production

Recommended startup command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Run migrations before startup:

```bash
alembic upgrade head
```

Use `/api/health` for platform health checks and
`/api/health/database` for database diagnostics.

See `../docs/deployment.md` for full deployment guidance.

## Related Documentation

- `../docs/architecture.md`
- `../docs/database.md`
- `../docs/api.md`
- `../SECURITY.md`
