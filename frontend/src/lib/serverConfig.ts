export function getBackendApiUrl() {
  const url = process.env.BACKEND_API_URL;
  const appEnv = process.env.APP_ENV ?? process.env.FRONTEND_APP_ENV;
  if (appEnv === "production" && !url) {
    throw new Error("BACKEND_API_URL is required in production");
  }
  return (url ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
}
