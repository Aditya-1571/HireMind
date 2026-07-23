# HireMind API Documentation

This document summarizes the public application API implemented by the FastAPI
backend and proxied by the Next.js frontend. It is intentionally concise; when
the backend is running, full generated schemas are available at:

- `/docs`
- `/redoc`
- `/openapi.json`

All examples are illustrative and use placeholder UUIDs and fictional content.
Do not use real Google tokens, cookies, resumes, answers, or user IDs in docs.

## API Layers

Browser code normally calls same-origin Next.js API routes under
`frontend/src/app/api`. Those route handlers forward requests to the FastAPI
backend and attach the backend session token from the HttpOnly cookie as a
Bearer token.

The backend endpoints below are registered in `backend/app/main.py`.

## Authentication Rules

- Public backend endpoints: `/api/health`, `/api/health/database`,
  `/api/ai/health`, `/api/auth/google`.
- Authenticated backend endpoints require:

```http
Authorization: Bearer <backend-session-token>
```

The browser should not manually construct this header. Next.js API route
handlers do it server-side from the HttpOnly session cookie.

## Error Shape

FastAPI validation and application errors commonly return:

```json
{
  "detail": "Readable error message"
}
```

Next.js proxy routes often normalize this to:

```json
{
  "message": "Readable error message"
}
```

## Health

### `GET /api/health`

Authentication: not required.

Purpose: lightweight backend health check.

Success:

```json
{
  "status": "ok",
  "service": "hiremind-api"
}
```

### `GET /api/health/database`

Authentication: not required.

Purpose: database diagnostic check using `SELECT 1`.

Success:

```json
{
  "status": "ok",
  "service": "hiremind-database"
}
```

If the database is unavailable, the endpoint returns a safe error-shaped JSON
body with `status: "error"`.

## Authentication

### `POST /api/auth/google`

Authentication: not required.

Purpose: verify a Google credential, create/update the user, and issue a backend
session token.

Request:

```json
{
  "credential": "google-id-token-placeholder"
}
```

Backend success:

```json
{
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "google_id": "google-sub-placeholder",
    "email": "candidate@example.com",
    "name": "Candidate Example",
    "profile_picture": "https://example.com/avatar.png"
  },
  "session_token": "backend-session-token-placeholder"
}
```

Next.js proxy behavior:

- forwards the credential to FastAPI
- stores `session_token` in an HttpOnly cookie
- returns only `{ "user": ... }` to the browser

Failure responses:

- `400` missing/invalid request JSON
- `401` invalid Google credential
- `500` Google authentication not configured
- `503` auth service unavailable from the proxy

### `GET /api/auth/me`

Authentication: required.

Purpose: return the authenticated user.

Success:

```json
{
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "google_id": "google-sub-placeholder",
    "email": "candidate@example.com",
    "name": "Candidate Example",
    "profile_picture": null
  }
}
```

Failure responses:

- `401` missing, invalid, or expired session

## Profile

### `GET /api/profile`

Authentication: required.

Purpose: return professional profile fields, saved interview defaults, account
information, and profile completion.

Success:

```json
{
  "profile": {
    "full_name": "Candidate Example",
    "professional_headline": "Aspiring Software Engineer",
    "target_role": "Backend Developer",
    "experience_level": "fresher",
    "bio": "I am preparing for backend engineering interviews."
  },
  "interview_defaults": {
    "interview_type": "Technical",
    "difficulty": "Medium",
    "question_count": 10,
    "time_limit_minutes": null,
    "evaluation_style": "balanced",
    "answer_mode": "text"
  },
  "account": {
    "email": "candidate@example.com",
    "auth_provider": "google",
    "created_at": "2026-07-23T00:00:00Z",
    "profile_picture_url": null
  },
  "profile_completion": 80
}
```

Ownership behavior: always uses the authenticated user; no user ID is accepted.

### `PATCH /api/profile`

Authentication: required.

Purpose: partially update profile information and/or saved interview defaults.

Request:

```json
{
  "profile": {
    "full_name": "Candidate Example",
    "target_role": "Full Stack Developer",
    "experience_level": "junior"
  },
  "interview_defaults": {
    "interview_type": "Mixed",
    "difficulty": "Medium",
    "question_count": 10,
    "time_limit_minutes": 30,
    "evaluation_style": "balanced",
    "answer_mode": "text"
  }
}
```

Success: same shape as `GET /api/profile`.

Failure responses:

- `400` invalid JSON from proxy
- `401` missing session
- `422` validation errors for unsupported fields, invalid enums, or length/range
  violations

## Resumes

### `GET /api/resumes`

Authentication: required.

Purpose: list resumes owned by the authenticated user, newest first.

Success:

```json
{
  "resumes": [
    {
      "id": "10000000-0000-0000-0000-000000000001",
      "original_filename": "resume.pdf",
      "file_type": "application/pdf",
      "extracted_text": "Parsed resume text...",
      "processing_status": "ready",
      "analysis_status": "ready",
      "analysis_data": {
        "candidate_name": "Candidate Example",
        "skills": ["Python", "React"]
      }
    }
  ]
}
```

### `POST /api/resumes`

Authentication: required.

Purpose: upload and parse a resume.

Request: `multipart/form-data` with field `file`.

Supported content types:

- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`

Maximum size: 5 MB.

Success: returns a `ResumeResponse` object.

Important failure responses:

- `400` missing file or empty file
- `401` missing session
- `413` file larger than 5 MB
- `415` unsupported content type or extension/content mismatch
- `422` invalid/corrupted PDF or DOCX, parser failure, or no readable text

### `POST /api/resumes/{resume_id}/analysis`

Authentication: required.

Purpose: run deterministic structured analysis on an owned parsed resume.

Success: returns the updated `ResumeResponse`.

Ownership behavior: returns `404` if the resume is not found for the current
user.

Failure responses:

- `400` resume is not parsed/ready
- `401` missing session
- `404` resume not found
- `422` analysis failed

## Interviews

### `POST /api/interviews`

Authentication: required.

Purpose: create an interview, generate questions, and persist the interview
before showing the session.

Request:

```json
{
  "resume_id": "10000000-0000-0000-0000-000000000001",
  "target_role": "Software Engineer",
  "custom_role": null,
  "interview_type": "Technical",
  "difficulty": "Medium",
  "question_count": 10,
  "time_limit_minutes": 30,
  "evaluation_style": "balanced",
  "answer_mode": "text"
}
```

Success:

```json
{
  "id": "20000000-0000-0000-0000-000000000001",
  "interview_type": "Technical",
  "difficulty": "Medium",
  "target_role": "Software Engineer",
  "status": "in_progress",
  "started_at": "2026-07-23T00:00:00Z",
  "completed_at": null,
  "question_count": 10,
  "time_limit_minutes": 30,
  "evaluation_style": "balanced",
  "answer_mode": "text",
  "duration_seconds": null,
  "answered_count": 0,
  "total_questions": 10,
  "questions": [],
  "overall_score": null,
  "overall_feedback": null,
  "strengths": [],
  "improvements": [],
  "question_evaluations": [],
  "generation_source": "ai"
}
```

The real response includes the generated `questions` array.

Validation:

- `interview_type`: `HR`, `Technical`, `Mixed`
- `difficulty`: `Easy`, `Medium`, `Hard`
- `question_count`: integer 5-30; booleans and decimals rejected
- `time_limit_minutes`: `null`, 15, 30, 45, or 60
- `evaluation_style`: `beginner_friendly`, `balanced`, or `strict`
- `answer_mode`: `text`
- target role must be predefined or a valid custom role

Ownership behavior:

- selected `resume_id` must belong to the authenticated user
- if selected resume analysis is not ready, interview creation continues without
  resume context

### `GET /api/interviews`

Authentication: required.

Purpose: paginated interview history summary.

Query parameters:

| Name | Validation |
| --- | --- |
| `page` | integer, minimum 1 |
| `page_size` | integer, 1-50 |
| `status` | `in_progress` or `completed` |
| `interview_type` | `HR`, `Technical`, or `Mixed` |
| `difficulty` | `Easy`, `Medium`, or `Hard` |
| `target_role` | optional search text, max 100 |
| `sort` | `newest`, `oldest`, `highest_score`, `lowest_score` |

Success:

```json
{
  "interviews": [
    {
      "id": "20000000-0000-0000-0000-000000000001",
      "target_role": "Software Engineer",
      "interview_type": "Technical",
      "difficulty": "Medium",
      "status": "completed",
      "overall_score": 82.0,
      "started_at": "2026-07-23T00:00:00Z",
      "completed_at": "2026-07-23T00:20:00Z",
      "question_count": 10,
      "time_limit_minutes": 30,
      "evaluation_style": "balanced",
      "answer_mode": "text",
      "duration_seconds": 1200,
      "resume_filename": "resume.pdf",
      "answered_count": 10,
      "total_questions": 10
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

The history summary does not return full question and answer payloads.

### `GET /api/interviews/{interview_id}`

Authentication: required.

Purpose: return full interview details for an owned interview.

Ownership behavior: `404` if the interview is not found for the current user.

### `POST /api/interviews/{interview_id}/answers`

Authentication: required.

Purpose: submit one answer to one question.

Request:

```json
{
  "question_id": "30000000-0000-0000-0000-000000000001",
  "answer": "I would first clarify requirements, then design the API contract..."
}
```

Success: returns the updated full interview response.

Failure responses:

- `400` empty answer, completed interview, or question does not belong to this
  interview
- `401` missing session
- `404` interview not found for current user
- `409` question already answered
- `422` request validation error

### `POST /api/interviews/{interview_id}/complete`

Authentication: required.

Purpose: complete an interview after all stored questions are answered and run
AI-first/fallback evaluation.

Request body: none.

Success: full interview response plus:

```json
{
  "evaluation_source": "ai"
}
```

Failure responses:

- `400` not all questions are answered or interview has no questions
- `401` missing session
- `404` interview not found for current user

Repeated completion is idempotent when a saved evaluation exists.

### `GET /api/interviews/{interview_id}/report`

Authentication: required.

Purpose: return a normalized professional report for a completed owned
interview.

Success:

```json
{
  "interview": {
    "id": "20000000-0000-0000-0000-000000000001",
    "target_role": "Software Engineer",
    "interview_type": "Technical",
    "difficulty": "Medium",
    "evaluation_style": "balanced",
    "answer_mode": "text",
    "question_count": 10,
    "answered_count": 10,
    "started_at": "2026-07-23T00:00:00Z",
    "completed_at": "2026-07-23T00:20:00Z",
    "duration_seconds": 1200,
    "time_limit_minutes": 30
  },
  "summary": {
    "overall_score": 82.0,
    "performance_level": "Strong",
    "overall_feedback": "Concise feedback.",
    "strengths": ["Clear communication"],
    "improvements": ["Add more implementation detail"]
  },
  "metrics": {
    "average_question_score": 8.2,
    "completion_rate": 100.0,
    "answered_questions": 10,
    "total_questions": 10
  },
  "questions": [],
  "recommendations": {
    "topics": ["implementation detail"],
    "next_interview": {
      "target_role": "Software Engineer",
      "difficulty": "Medium",
      "interview_type": "Technical",
      "question_count": 15,
      "focus_topics": ["implementation detail"]
    }
  }
}
```

Failure responses:

- `401` missing session
- `404` interview report not found for current user
- `409` interview is not completed

## Analytics

### `GET /api/interviews/analytics/summary`

Authentication: required.

Purpose: dashboard analytics for the authenticated user.

Success:

```json
{
  "total_interviews": 5,
  "completed_interviews": 3,
  "in_progress_interviews": 2,
  "average_completed_score": 78.3,
  "highest_score": 91.0,
  "latest_completed_score": 82.0,
  "most_practised_target_role": "Software Engineer",
  "score_trend": [
    {
      "interview_id": "20000000-0000-0000-0000-000000000001",
      "date": "2026-07-23T00:20:00Z",
      "target_role": "Software Engineer",
      "interview_type": "Technical",
      "score": 82.0
    }
  ],
  "average_score_by_type": [
    {
      "interview_type": "Technical",
      "average_score": 82.0,
      "count": 1
    }
  ]
}
```

Score calculations include only completed interviews with valid 0-100 overall
scores.

## AI Provider Status

### `GET /api/ai/health`

Authentication: not required.

Purpose: check whether Ollama is reachable and the configured model is
available.

Success:

```json
{
  "status": "ok",
  "ollama_reachable": true,
  "model": "qwen2.5:1.5b",
  "model_available": true
}
```

Failure responses:

- `503` Ollama unavailable or configured model missing

### `POST /api/ai/test-generation`

Authentication: required.

Purpose: run one fixed safe test prompt against Ollama.

Request body: none.

Success:

```json
{
  "model": "qwen2.5:1.5b",
  "generated_text": "HireMind AI connection test successful."
}
```

Failure responses:

- `401` missing session
- `503` generation unavailable
- `504` generation timed out

The endpoint does not accept arbitrary user prompts.

## Authorization Summary

All user-owned endpoint groups use the authenticated backend session rather than
any user ID supplied by the frontend. Resource IDs in paths are checked against
the current user before data is returned or modified.

Cross-user resume, interview, and report lookups are handled as not found.

## Notes for API Consumers

- Prefer browser calls to Next.js `/api/...` routes, not direct browser calls to
  FastAPI.
- Use the FastAPI `/docs`, `/redoc`, or `/openapi.json` endpoints for generated
  schema details during development.
- Do not depend on internal prompts, fallback internals, or raw provider error
  messages; they are intentionally not exposed.
