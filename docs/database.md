# HireMind Database Documentation

HireMind uses SQLAlchemy ORM models with Alembic migrations and a PostgreSQL
database. Neon-compatible PostgreSQL connection strings are used for production
deployment guidance.

## Overview

The application schema currently contains five tables:

- `users`
- `user_profiles`
- `resumes`
- `interviews`
- `interview_questions`

There is no separate answer table and no separate report table. Answers,
per-question feedback, and per-question scores are stored on
`interview_questions`. Report summaries are normalized from `interviews`,
`interview_questions`, and `interviews.evaluation_data`.

## ER Diagram

```mermaid
erDiagram
    users ||--o{ resumes : owns
    users ||--o{ interviews : owns
    users ||--o| user_profiles : has
    resumes ||--o{ interviews : contextualizes
    interviews ||--o{ interview_questions : contains

    users {
        uuid id PK
        string google_id UK
        string email UK
        string name
        string profile_picture
        timestamptz created_at
        timestamptz updated_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK_UK
        string full_name
        string professional_headline
        string target_role
        string experience_level
        string bio
        string default_interview_type
        string default_difficulty
        integer default_question_count
        integer default_time_limit_minutes
        string default_evaluation_style
        string default_answer_mode
        timestamptz created_at
        timestamptz updated_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        string original_filename
        string file_type
        text extracted_text
        string processing_status
        string analysis_status
        jsonb analysis_data
        timestamptz uploaded_at
    }

    interviews {
        uuid id PK
        uuid user_id FK
        uuid resume_id FK
        string interview_type
        string difficulty
        string target_role
        string status
        integer question_count
        integer time_limit_minutes
        string evaluation_style
        string answer_mode
        numeric overall_score
        jsonb evaluation_data
        timestamptz started_at
        timestamptz completed_at
        integer duration_seconds
    }

    interview_questions {
        uuid id PK
        uuid interview_id FK
        text question_text
        text user_answer
        text feedback
        numeric score
        integer sequence_number
    }
```

## Tables

### `users`

Purpose: stores authenticated Google users.

Important fields:

- `id`: UUID primary key.
- `google_id`: unique Google subject identifier; indexed.
- `email`: unique email; indexed.
- `name`: display name from Google.
- `profile_picture`: optional Google profile image URL.
- `created_at`, `updated_at`: timezone-aware timestamps.

Relationships:

- one user has many resumes.
- one user has many interviews.
- one user has zero or one user profile.

Deletion behavior:

- deleting a user cascades to resumes, interviews, and user profile through
  foreign keys and ORM cascade settings.

### `user_profiles`

Purpose: stores professional profile information and saved interview defaults.

Important fields:

- `id`: UUID primary key.
- `user_id`: unique foreign key to `users.id`, `ON DELETE CASCADE`.
- `full_name`, `professional_headline`, `target_role`, `experience_level`,
  `bio`: optional professional profile fields.
- `default_interview_type`, `default_difficulty`, `default_question_count`,
  `default_time_limit_minutes`, `default_evaluation_style`,
  `default_answer_mode`: interview preference fields.
- `created_at`, `updated_at`: timezone-aware timestamps.

Constraints:

- `uq_user_profiles_user_id` ensures one profile per user.
- `default_question_count` is non-null with server default `10`.
- `default_evaluation_style` is non-null with server default `balanced`.
- `default_answer_mode` is non-null with server default `text`.

Validation:

- enum and length validation happens in the FastAPI profile schema/service, not
  through database enums.

### `resumes`

Purpose: stores resume metadata, extracted text, parsing status, and structured
analysis.

Important fields:

- `id`: UUID primary key.
- `user_id`: foreign key to `users.id`, `ON DELETE CASCADE`; indexed.
- `original_filename`: sanitized basename of the uploaded filename.
- `file_type`: uploaded content type.
- `extracted_text`: parsed text, nullable.
- `processing_status`: `uploaded`, `processing`, `ready`, or `failed`.
- `analysis_status`: `pending`, `analyzing`, `ready`, or `failed`.
- `analysis_data`: JSONB structured resume analysis, nullable.
- `uploaded_at`: timestamp.

Deletion behavior:

- deleting a user deletes resumes.
- interviews reference resumes with `ON DELETE SET NULL`, so historical
  interviews can remain after a resume is deleted.

### `interviews`

Purpose: stores interview metadata, configuration, lifecycle status, and summary
evaluation data.

Important fields:

- `id`: UUID primary key.
- `user_id`: foreign key to `users.id`, `ON DELETE CASCADE`; indexed.
- `resume_id`: optional foreign key to `resumes.id`, `ON DELETE SET NULL`;
  indexed.
- `interview_type`: `HR`, `Technical`, or `Mixed` by application validation.
- `difficulty`: `Easy`, `Medium`, or `Hard` by application validation.
- `target_role`: selected or custom role.
- `status`: currently `in_progress` or `completed`.
- `question_count`: requested question count.
- `time_limit_minutes`: nullable advisory time limit.
- `evaluation_style`: `beginner_friendly`, `balanced`, or `strict`.
- `answer_mode`: currently `text`.
- `overall_score`: numeric 0-100 overall score when evaluated.
- `evaluation_data`: JSONB summary and question-level strengths/improvements.
- `started_at`, `completed_at`, `duration_seconds`: timing fields.

Indexes:

- `ix_interviews_user_id`
- `ix_interviews_resume_id`
- `ix_interviews_status`

### `interview_questions`

Purpose: stores generated questions, submitted answers, per-question score, and
feedback.

Important fields:

- `id`: UUID primary key.
- `interview_id`: foreign key to `interviews.id`, `ON DELETE CASCADE`.
- `question_text`: persisted question text.
- `user_answer`: submitted text answer, nullable until answered.
- `feedback`: per-question feedback, nullable until evaluated.
- `score`: numeric 0-10 score, nullable until evaluated.
- `sequence_number`: question order within the interview.

Indexes and constraints:

- `ix_interview_questions_interview_id`
- `ix_interview_questions_interview_sequence`, unique on
  `(interview_id, sequence_number)`.

## Ownership Model

User ownership is enforced at the backend query layer:

- resumes are queried by `Resume.user_id`.
- interviews are queried by `Interview.user_id`.
- profile endpoints use only `current_user.id`.
- analytics aggregate only interviews for the authenticated user.

The database also uses foreign keys to keep user-owned data connected to
`users.id`.

## JSONB Fields

PostgreSQL JSONB fields can store arbitrary JSON at the database level. HireMind
relies on application code to write and read expected shapes.

### `resumes.analysis_data`

Nullable: yes.

Written by: `resume_intelligence_service.analyze_resume_text`.

Expected current shape:

```json
{
  "metadata": {
    "analysis_version": "deterministic-v2",
    "generated_at": "2026-07-23T00:00:00+00:00",
    "parser_type": "deterministic_regex_sections"
  },
  "candidate_name": null,
  "email": null,
  "phone": null,
  "summary": null,
  "skills": [],
  "skills_categorized": {
    "programming_languages": [],
    "ml_ai": [],
    "frameworks_libraries": [],
    "tools_platforms": [],
    "databases": [],
    "cloud_devops": [],
    "other": []
  },
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "achievements": []
}
```

Backward compatibility:

- frontend and prompt helpers handle legacy flat arrays for projects,
  experience, and skills.
- malformed analysis data is ignored for AI context where necessary.

Privacy note:

- contact fields may be present in `analysis_data`, but prompt-building code is
  intended to use safe resume context rather than sending contact information to
  Ollama.

### `interviews.evaluation_data`

Nullable: yes.

Written by: `answer_evaluator.AnswerEvaluationResult.evaluation_data`.

Expected current shape:

```json
{
  "overall_feedback": "Concise feedback text.",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "question_evaluations": [
    {
      "sequence_number": 1,
      "strength": "Question-level strength.",
      "improvement": "Question-level improvement."
    }
  ]
}
```

Important:

- `evaluation_source` is not persisted in this JSONB field.
- per-question `score` and `feedback` are stored on `interview_questions`.
- `overall_score` is stored on `interviews`.
- report rendering tolerates missing or malformed optional fields.

## Timestamps and Duration

- `users.created_at`, `users.updated_at`, `user_profiles.created_at`,
  `user_profiles.updated_at`, and `resumes.uploaded_at` use database server
  defaults.
- `interviews.started_at` is set when the interview is created.
- `interviews.completed_at` is set when completion succeeds.
- `duration_seconds` is calculated by the backend from timestamps and clamped to
  a non-negative integer.

## Migration Process

Alembic migration files are stored in `backend/alembic/versions`.

Run migrations from the backend directory:

```bash
alembic upgrade head
alembic current
```

No database enum types are currently used for interview settings or statuses;
the application validates those values.

## Neon Production Notes

- Use a PostgreSQL URL with the psycopg driver.
- Plain `postgresql://` URLs are normalized to `postgresql+psycopg://` by
  backend settings.
- Include `sslmode=require` in Neon connection strings.
- Run `alembic upgrade head` before production startup.

## Data Privacy Considerations

The database may contain personal data:

- email and Google profile data
- resumes and extracted resume text
- resume analysis data
- interview answers and feedback

Production operators should define retention and deletion policies appropriate
for their deployment. The application does not currently implement account
deletion or automated data retention.
