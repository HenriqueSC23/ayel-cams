import type { CameraRecord } from '../data/platform';
import { httpClient } from './http-client';

interface CameraListResponse {
  items: CameraRecord[];
}

interface CameraItemResponse {
  item: CameraRecord;
}

interface CameraQuery {
  access?: 'public' | 'restricted';
  status?: 'live' | 'offline';
  search?: string;
}

export interface CreateCameraInput {
  name: string;
  location: string;
  category: string;
  description: string;
  access: 'public' | 'restricted';
  status: 'live' | 'offline';
  quality: 'HD' | 'FHD' | '4K';
  unit?: string;
  image?: string;
}

export interface UpdateCameraInput {
  name?: string;
  location?: string;
  category?: string;
  description?: string;
  access?: 'public' | 'restricted';
  status?: 'live' | 'offline';
  quality?: 'HD' | 'FHD' | '4K';
  unit?: string;
  image?: string;
}

function toQueryString(query: CameraQuery) {
  const searchParams = new URLSearchParams();

  if (query.access) {
    searchParams.set('access', query.access);
  }

  if (query.status) {
    searchParams.set('status', query.status);
  }

  if (query.search) {
    searchParams.set('search', query.search);
  }

  const value = searchParams.toString();
  return value ? `?${value}` : '';
}

export async function getCamerasRequest(query: CameraQuery = {}, token?: string | null) {
  const response = await httpClient<CameraListResponse>(`/cameras${toQueryString(query)}`, {
    method: 'GET',
    token,
  });

  return response.items;
}

export async function createCameraRequest(input: CreateCameraInput, token: string) {
  const response = await httpClient<CameraItemResponse>('/cameras', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function updateCameraRequest(cameraId: string, input: UpdateCameraInput, token: string) {
  const response = await httpClient<CameraItemResponse>(`/cameras/${cameraId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteCameraRequest(cameraId: string, token: string) {
  await httpClient<null>(`/cameras/${cameraId}`, {
    method: 'DELETE',
    token,
  });
}
