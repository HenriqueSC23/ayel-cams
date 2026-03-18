import type { AuthRole } from '../auth/auth-context';
import { httpClient } from './http-client';

export interface UserPreferences {
  notifyAlerts: boolean;
  prioritizeFavorites: boolean;
  rememberLastView: boolean;
  preferGridView: boolean;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  profile: 'Administrador' | 'Cliente';
  access: string;
  status: 'Ativo' | 'Inativo';
  unit: string;
  avatar: string;
  lastAccess: string;
  phone: string;
  company: string;
  jobTitle: string;
  preferences: UserPreferences;
}

interface AuthResponse {
  token: string;
  user: AuthUserResponse;
}

export function signInRequest(input: { email: string; password: string }) {
  return httpClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signUpRequest(input: { fullName: string; email: string; password: string }) {
  return httpClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMeRequest(token: string) {
  return httpClient<AuthUserResponse>('/auth/me', {
    method: 'GET',
    token,
  });
}

export function signOutRequest(token: string) {
  return httpClient<null>('/auth/logout', {
    method: 'POST',
    token,
  });
}
