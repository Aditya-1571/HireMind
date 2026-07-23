import { cookies } from "next/headers";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();
export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME ?? "hiremind_session";

export type AuthUser = {
  id: string;
  google_id: string;
  email: string;
  name: string;
  profile_picture: string | null;
};

type MeResponse = {
  user: AuthUser;
};

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookieName)?.value;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as MeResponse;
    return data.user;
  } catch {
    return null;
  }
}
