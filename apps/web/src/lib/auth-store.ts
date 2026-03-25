interface AuthState {
  user: { id: string; email: string; name: string; role: string } | null;
  tenant: { id: string; name: string; slug: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
}

let authState: AuthState = { user: null, tenant: null, accessToken: null, refreshToken: null };

export function getAuth(): AuthState {
  return authState;
}

export function setAuth(state: Partial<AuthState>): void {
  authState = { ...authState, ...state };
}

export function clearAuth(): void {
  authState = { user: null, tenant: null, accessToken: null, refreshToken: null };
}

export function isAuthenticated(): boolean {
  return authState.accessToken !== null;
}
