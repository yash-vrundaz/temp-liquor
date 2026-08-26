import {
  clearClientAccessToken,
  getClientAccessToken,
  setClientAccessToken,
} from "@/lib/auth/client-token";
import { sanitizeApiError } from "@/lib/connection-messages";

type AuthTokenResponse = {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        clearClientAccessToken();
        return false;
      }
      const data = (await res.json()) as AuthTokenResponse;
      if (typeof data.accessToken === "string" && data.accessToken) {
        setClientAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      clearClientAccessToken();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function isAuthPublicPath(path: string) {
  return (
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/signup") ||
    path.startsWith("/api/auth/refresh") ||
    path.startsWith("/api/auth/logout")
  );
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const run = async (allowRefresh: boolean): Promise<T> => {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    const bearer = getClientAccessToken();
    if (bearer && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }

    const res = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      ...init,
      headers,
    });

    if (res.status === 401 && allowRefresh && !isAuthPublicPath(path)) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) return run(false);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const raw =
        typeof data.error === "string" ? data.error : `Request failed: ${res.status}`;
      throw new Error(sanitizeApiError(raw));
    }

    if (typeof data.accessToken === "string" && data.accessToken) {
      setClientAccessToken(data.accessToken);
    }

    return data as T;
  };

  return run(true);
}
