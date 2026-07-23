# HireMind Security Notes

This document lists the production security expectations for HireMind. Use
placeholder values only in committed examples.

## Environment Variables

Server-only values:

- `DATABASE_URL`
- `BACKEND_DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `BACKEND_GOOGLE_CLIENT_ID`
- `SESSION_SECRET`
- `BACKEND_SESSION_SECRET`
- `SESSION_EXPIRE_MINUTES`
- `BACKEND_SESSION_EXPIRE_MINUTES`
- `BACKEND_API_URL`
- `BACKEND_CORS_ORIGINS`
- `BACKEND_TRUSTED_HOSTS`
- `OLLAMA_BASE_URL`
- `BACKEND_OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `BACKEND_OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_SECONDS`
- `BACKEND_OLLAMA_TIMEOUT_SECONDS`
- `SITE_URL`
- `SESSION_COOKIE_NAME`

Browser-exposed values:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Do not prefix database URLs, session secrets, private backend URLs, or API keys
with `NEXT_PUBLIC_`.

## Google OAuth

- Configure the production Google OAuth client with the deployed frontend
  origin.
- The backend verifies Google ID tokens using the configured `GOOGLE_CLIENT_ID`.
- Do not accept user identity directly from the frontend.

## Sessions

- The frontend stores the backend session token in an HttpOnly cookie.
- Cookies use `SameSite=Lax`, `Path=/`, and `Secure` in production.
- Session tokens must not be placed in URLs, localStorage, logs, or analytics.

## CORS and Hosts

- Development may use explicit localhost origins.
- Production must set exact origins in `BACKEND_CORS_ORIGINS`.
- Do not use wildcard origins with credentials.
- Production must set explicit `BACKEND_TRUSTED_HOSTS`.

## Uploads

- Resume uploads are limited to 5 MB.
- Supported formats are PDF, DOCX, and TXT.
- Filenames are treated as untrusted display metadata.
- The application does not claim antivirus scanning.

## AI Safety

- Prompts should keep instructions separate from user-provided resume and answer
  content.
- User content is size-limited before being sent to the local model.
- Model output must be parsed defensively and validated before use.
- Internal prompts, provider responses, and stack traces must not be exposed to
  users.

## Rate Limiting

Application-level distributed rate limiting is not implemented. Configure rate
limits at the deployment layer for:

- Google login
- Resume upload and analysis
- AI test generation
- Interview creation
- Interview completion/evaluation

## Deployment Checklist

- Use HTTPS.
- Set strong `SESSION_SECRET`.
- Set production `DATABASE_URL` with SSL.
- Set exact CORS origins and trusted hosts.
- Configure Google OAuth origins.
- Keep real secrets out of source control and logs.
- Run frontend and backend validation before deployment.
