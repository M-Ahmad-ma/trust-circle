import { postJson, setSession, clearSession } from '../session';
import type { AuthSession, AuthUser } from '../types';

export function login(email: string, password: string): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/login', { email, password }).then(async (session) => {
    await setSession(session);
    return session;
  });
}

export function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/register', input).then(async (session) => {
    await setSession(session);
    return session;
  });
}

/** Server revokes the token if present and never fails for an unknown one. */
export async function logout(refreshToken: string | null): Promise<void> {
  try {
    if (refreshToken) await postJson<{ ok: true }>('/api/auth/logout', { refreshToken });
  } catch {
    // Idempotent by contract — a failed logout must not block the local clear.
  }
  await clearSession();
}

export type { AuthSession, AuthUser };
