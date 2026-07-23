# HireMind

**AI-assisted interview preparation with resume-aware questions, answer evaluation, reports, and performance history.**

HireMind is a full-stack interview preparation platform built for candidates who
want a focused way to practice role-specific interviews. Users sign in with
Google, upload a resume, configure an interview, answer generated questions, and
review structured feedback through reports and history analytics.

The project is designed as a production-oriented final-year/portfolio project:
it includes authentication, ownership-scoped APIs, PostgreSQL persistence,
local Ollama AI integration with deterministic fallbacks, accessibility polish,
deployment documentation, and CI validation.

## Table of Contents

- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Technical Documentation](#technical-documentation)
- [Technology Stack](#technology-stack)
- [How HireMind Works](#how-hiremind-works)
- [Repository Structure](#repository-structure)
- [Local Installation](#local-installation)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Running the App](#running-the-app)
- [Testing and Validation](#testing-and-validation)
- [Deployment Overview](#deployment-overview)
- [Security and Privacy](#security-and-privacy)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Key Features

### Authentication

- Google Identity Services login.
- Backend-verified Google ID tokens.
- HttpOnly session cookie flow through the Next.js frontend.
- Protected routes and ownership-scoped backend resources.

### Resume Analysis

- PDF, DOCX, and TXT resume uploads.
- Local file validation and safe upload handling.
- Deterministic text extraction and structured resume analysis.
- Parsed sections for contact information, skills, education, experience,
  projects, certifications, and related resume intelligence.

### Interview Preparation

- Configurable interview type, target role, difficulty, question count, time
  limit, evaluation style, and text answer mode.
- Optional analyzed resume context for personalized question generation.
- Local Ollama question generation with deterministic static fallback.
- Practice Again links that prefill compatible interview settings.

### Interview Session

- One-question-at-a-time interview flow.
- Text answer submission with duplicate-submit protection.
- Progress tracking across variable-length interviews.
- Advisory timer for configured time limits.

### Evaluation and Reporting

- AI-first answer evaluation through Ollama.
- Deterministic fallback evaluation when AI is unavailable or returns invalid
  output.
- Overall score, per-question score, concise feedback, strengths, and
  improvements.
- Professional report page with print and browser Save as PDF support.

### History and Analytics

- Paginated interview history with filters and sorting.
- Dashboard analytics for completed and in-progress interviews.
- Score trend and average score summaries based only on the authenticated user's
  data.

### Profile and Settings

- Professional profile fields and profile-completion progress.
- Read-only Google account information.
- Light and dark appearance modes with local preference persistence.
- Safe sign-out flow.

### Accessibility and UX

- Responsive layout across mobile, tablet, laptop, and desktop sizes.
- Route-level loading, error, empty, and not-found states.
- Keyboard-accessible navigation and form controls.
- Metadata, sitemap, robots, manifest, favicon, and Open Graph assets.

### Production Engineering

- FastAPI validation and service-layer separation.
- Alembic migrations for database changes.
- Environment-driven CORS, trusted hosts, session settings, and AI provider
  configuration.
- GitHub Actions for frontend and backend validation.

## Screenshots

Screenshots are not currently committed to the repository. Suggested future
captures are documented in [docs/assets/screenshots/README.md](docs/assets/screenshots/README.md).

Recommended screenshot set:

- Landing page
- Dashboard
- Resume analysis
- Start interview
- Interview session
- Interview report
- History
- Settings and appearance
- Dark mode

## Architecture

```mermaid
flowchart LR
    Browser["User browser"] --> Frontend["Next.js App Router UI"]
    Frontend --> Proxy["Next.js API proxy routes"]
    Proxy --> Backend["FastAPI backend"]
    Backend --> DB["PostgreSQL / Neon"]
    Backend --> Ollama["Local Ollama server"]
    Backend --> Google["Google token verification"]

    Browser -. "Google Identity Services" .-> Google
    Backend -. "HttpOnly session cookie via frontend" .-> Browser
```

Request flow in practice:

- Browser pages call Next.js API routes under `frontend/src/app/api`.
- Next.js proxy routes forward authenticated requests to FastAPI.
- FastAPI validates input, checks ownership, and persists data in PostgreSQL.
- Ollama is called only by backend AI services, never directly by the browser.
- Google ID tokens are verified on the backend before a session is issued.

## Technical Documentation

For deeper implementation details:

- [Architecture](docs/architecture.md): system design, request flows,
  authentication, AI workflow, deployment boundaries, and trade-offs.
- [Database](docs/database.md): SQLAlchemy entities, relationships, JSONB
  fields, indexes, constraints, and migration notes.
- [API](docs/api.md): FastAPI endpoints, auth requirements, request/response
  examples, failure responses, and ownership behavior.
- [Deployment](docs/deployment.md): production topology, environment variables,
  OAuth setup, health checks, CI, and launch checklist.
- [Security](SECURITY.md): secret handling, sessions, CORS, uploads, AI safety,
  and rate-limiting expectations.
- [Screenshot guide](docs/assets/screenshots/README.md): suggested screenshot
  filenames for future README images.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy, Alembic |
| Database | PostgreSQL, Neon-compatible connection strings |
| Authentication | Google Identity Services, backend-issued session token, HttpOnly cookie |
| AI | Ollama over direct HTTP, configured for `qwen2.5:1.5b`, deterministic fallbacks |
| Resume parsing | PyMuPDF, python-docx, deterministic Python parsing |
| Quality | ESLint, TypeScript, Python `unittest`, `compileall`, Alembic |
| CI | GitHub Actions for frontend lint/typecheck/build and backend compile/tests/import |
| Deployment targets | Vercel frontend, Render/Railway/Fly-compatible backend, Neon PostgreSQL |

Version pins are intentionally kept in the project manifests instead of repeated
here. See [frontend/package.json](frontend/package.json) and
[backend/requirements.txt](backend/requirements.txt).

## How HireMind Works

1. The user signs in with Google.
2. The user uploads a resume.
3. The backend extracts and analyzes resume content.
4. The user configures a target role, interview type, difficulty, length, and
   evaluation style.
5. The backend attempts to generate interview questions through Ollama.
6. If AI generation is unavailable or invalid, deterministic fallback questions
   keep the interview usable.
7. The user answers each question in a focused session.
8. The backend evaluates the completed interview, stores results, and displays a
   professional report and history analytics.

AI output is intended for interview preparation and should be reviewed with
human judgment. It is not a guarantee of hiring outcomes or answer correctness.

## Repository Structure

```text
HireMind/
+-- backend/
|   +-- alembic/              # Database migrations
|   +-- app/
|   |   +-- ai/               # Ollama clients, prompts, generation, evaluation
|   |   +-- api/              # FastAPI route modules
|   |   +-- data/             # Static fallback question bank
|   |   +-- models/           # SQLAlchemy models
|   |   +-- parsers/          # PDF/DOCX/TXT parsing helpers
|   |   +-- services/         # Business logic and normalization
|   +-- tests/                # Backend unit tests
|   +-- .env.example
|   +-- requirements.txt
|   +-- README.md
+-- frontend/
|   +-- public/               # Icons and social-sharing assets
|   +-- src/
|   |   +-- app/              # Next.js routes, API proxies, metadata routes
|   |   +-- components/       # Reusable UI and feature components
|   |   +-- lib/              # API helpers, auth helpers, error utilities
|   +-- .env.example
|   +-- package.json
+-- docs/
|   +-- assets/
|   +-- deployment.md
+-- .github/workflows/        # CI validation workflows
+-- .env.example              # Combined local environment template
+-- SECURITY.md
+-- LICENSE
+-- README.md
```

## Local Installation

### Prerequisites

- Git
- Node.js and npm
- Python 3.11 or newer
- PostgreSQL database, such as Neon
- Google OAuth client ID
- Ollama, optional but required for local AI generation/evaluation

### Clone the Repository

```bash
git clone <your-repository-url>
cd HireMind
```

### Backend Setup

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a backend environment file:

```powershell
Copy-Item .env.example .env
```

Then fill in safe local values for `DATABASE_URL`, `GOOGLE_CLIENT_ID`, and
`SESSION_SECRET`.

### Frontend Setup

```bash
cd frontend
npm install
```

Create a frontend environment file:

```powershell
Copy-Item .env.example .env.local
```

Set `BACKEND_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Ollama Setup

Install Ollama separately, then pull the configured model:

```bash
ollama pull qwen2.5:1.5b
```

The default backend configuration expects Ollama at:

```text
http://127.0.0.1:11434
```

If Ollama is stopped or the model is missing, HireMind falls back where designed
instead of failing interview creation or completion.

## Environment Variables

Do not commit real secrets. Use `.env.example` files as templates only.

### Backend

| Variable | Required | Purpose | Safe example |
| --- | --- | --- | --- |
| `BACKEND_APP_NAME` | Optional | FastAPI application title | `HireMind API` |
| `BACKEND_APP_ENV` or `APP_ENV` | Required in production | Runtime environment | `production` |
| `DATABASE_URL` or `BACKEND_DATABASE_URL` | Required | PostgreSQL/Neon connection string | `postgresql+psycopg://user:pass@host/db?sslmode=require` |
| `GOOGLE_CLIENT_ID` or `BACKEND_GOOGLE_CLIENT_ID` | Required | Google ID token audience | `your-client-id.apps.googleusercontent.com` |
| `SESSION_SECRET` or `BACKEND_SESSION_SECRET` | Required | Backend session signing secret | `replace-with-a-long-random-secret` |
| `SESSION_EXPIRE_MINUTES` or `BACKEND_SESSION_EXPIRE_MINUTES` | Optional | Session lifetime | `1440` |
| `BACKEND_CORS_ORIGINS` | Required in production | Allowed frontend origins | `["https://your-frontend.example.com"]` |
| `BACKEND_TRUSTED_HOSTS` | Required in production | Allowed backend hosts | `["your-backend.example.com"]` |
| `OLLAMA_BASE_URL` or `BACKEND_OLLAMA_BASE_URL` | Optional | Ollama server URL | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` or `BACKEND_OLLAMA_MODEL` | Optional | Ollama model name | `qwen2.5:1.5b` |
| `OLLAMA_TIMEOUT_SECONDS` or `BACKEND_OLLAMA_TIMEOUT_SECONDS` | Optional | AI request timeout | `60` |

### Frontend

| Variable | Required | Purpose | Safe example |
| --- | --- | --- | --- |
| `FRONTEND_APP_ENV` or `APP_ENV` | Required in production | Frontend runtime mode | `production` |
| `BACKEND_API_URL` | Required in production | Server-only backend URL for Next.js proxy routes | `https://your-backend.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Required | Browser-safe Google client ID | `your-client-id.apps.googleusercontent.com` |
| `SITE_URL` | Recommended | Canonical URL for metadata, sitemap, and robots | `https://your-frontend.example.com` |
| `SESSION_COOKIE_NAME` | Optional | Frontend HttpOnly session cookie name | `hiremind_session` |

Only values intentionally required in the browser should use `NEXT_PUBLIC_`.

## Database Migrations

Run migrations from the backend directory after configuring `DATABASE_URL`:

```bash
cd backend
alembic upgrade head
alembic current
```

Existing migration files live in [backend/alembic/versions](backend/alembic/versions).

## Running the App

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`
- Backend health: `http://127.0.0.1:8000/api/health`

## Testing and Validation

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
python -m compileall app
python -m unittest discover -s tests
python -c "from app.main import app; print(app.title)"
```

CI workflows:

- [frontend-ci.yml](.github/workflows/frontend-ci.yml) installs frontend
  dependencies, runs ESLint, runs TypeScript, and builds the Next.js app.
- [backend-ci.yml](.github/workflows/backend-ci.yml) installs backend
  dependencies, compiles Python modules, runs unit tests, and imports the FastAPI
  app.

## Deployment Overview

HireMind is prepared for a split deployment:

- Frontend on Vercel
- Backend on Render, Railway, Fly.io, or a similar Python web platform
- PostgreSQL on Neon
- Ollama on the backend host or another private host reachable by the backend

See [docs/deployment.md](docs/deployment.md) for production environment
variables, Google OAuth setup, Neon migration steps, health checks, CI notes,
and launch checklist.

## Security and Privacy

HireMind includes several production-oriented safeguards:

- Google tokens are verified on the backend.
- Session tokens are stored in HttpOnly cookies by the frontend.
- User-owned resources are scoped to the authenticated user.
- Uploads are validated by file type and size.
- Inputs are validated with Pydantic and frontend form validation.
- CORS and trusted hosts are environment-driven.
- Security headers are configured in the frontend.
- Secrets are expected to be supplied through environment variables.

Important privacy notes:

- Resumes, answers, and reports can contain personal information.
- Operators should define their own retention, deletion, and privacy policies.
- AI output may be inaccurate and should be treated as preparation guidance, not
  professional hiring advice.
- Deployment-layer rate limiting is recommended for production.

See [SECURITY.md](SECURITY.md) for the security checklist and deployment
expectations.

## Known Limitations

- Ollama must be installed and configured separately for local AI functionality.
- There is no distributed application-level rate limiter; use the deployment
  platform or gateway for production rate limits.
- AI question generation and evaluation depend on model availability and output
  quality.
- There is no recruiter/admin portal.
- Voice interviews, video interviews, coding editor workflows, and webcam
  analysis are not implemented.
- Uploads do not include antivirus or malware scanning.
- Production OAuth origins, domains, HTTPS, and deployment secrets must be
  configured manually.

## Future Improvements

Potential future work, not current functionality:

- Voice interview mode.
- Coding interview sessions.
- Recruiter or mentor workspace.
- Email notifications.
- Broader AI provider abstraction.
- Distributed rate limiting.
- Automated browser and accessibility regression testing.

## Contributing

Contributions should keep the application behavior accurate and avoid
documenting planned work as completed functionality.

Suggested workflow:

1. Create a feature branch.
2. Keep frontend, backend, and database changes scoped.
3. Add or update tests when behavior changes.
4. Run frontend and backend validation before opening a pull request.
5. Do not commit real secrets or local environment files.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Author

Copyright (c) 2026 ADITYA THAKUR.

Public GitHub, LinkedIn, portfolio, or email links can be added here before
publishing if you want recruiters and collaborators to contact you directly from
the README.
