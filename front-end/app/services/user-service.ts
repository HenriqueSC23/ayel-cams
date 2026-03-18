import type { UserRecord } from '../data/platform';
import { httpClient } from './http-client';

interface UsersResponse {
  items: UserRecord[];
}

interface UserItemResponse {
  item: UserRecord;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  profile: 'Administrador' | 'Cliente';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  status: 'Ativo' | 'Inativo';
  unit?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  profile?: 'Administrador' | 'Cliente';
  access?: 'Administrador' | 'Area restrita' | 'Sem acesso';
  status?: 'Ativo' | 'Inativo';
  unit?: string;
}

export async function getUsersRequest(token: string) {
  const response = await httpClient<UsersResponse>('/users', {
    method: 'GET',
    token,
  });

  return response.items;
}

export async function createUserRequest(input: CreateUserInput, token: string) {
  const response = await httpClient<UserItemResponse>('/users', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function updateUserRequest(userId: string, input: UpdateUserInput, token: string) {
  const response = await httpClient<UserItemResponse>(`/users/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteUserRequest(userId: string, token: string) {
  await httpClient<null>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}
