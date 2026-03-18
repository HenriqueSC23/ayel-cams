import type { AuthUserResponse, UserPreferences } from './auth-service';
import { httpClient } from './http-client';

interface ProfileItemResponse {
  item: AuthUserResponse;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  unit?: string;
  preferences?: Partial<UserPreferences>;
}

export async function getProfileRequest(token: string) {
  const response = await httpClient<ProfileItemResponse>('/profile/me', {
    method: 'GET',
    token,
  });

  return response.item;
}

export async function updateProfileRequest(input: UpdateProfileInput, token: string) {
  const response = await httpClient<ProfileItemResponse>('/profile/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function updateProfilePasswordRequest(input: { currentPassword: string; newPassword: string }, token: string) {
  await httpClient<null>('/profile/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}
