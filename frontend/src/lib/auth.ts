import type { User } from "@/lib/types";

const TOKEN_KEY = "hostmetricspro_access_token";
const USER_KEY = "hostmetricspro_user";

export function setSession(token: string, user: User): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function hasSession(): boolean {
  const token = getToken();
  const user = getStoredUser();
  return Boolean(token && user);
}

export function getSession(): { token: string | null; user: User | null } {
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return {
      token: null,
      user: null,
    };
  }

  return {
    token,
    user,
  };
}