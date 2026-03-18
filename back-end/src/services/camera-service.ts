import type { CameraRecord } from '../types/domain-types.js';
import {
  findCameraByIdFromDb,
  getNextCameraIdFromDb,
  insertCameraToDb,
  listCamerasFromDb,
  removeCameraFromDb,
  updateCameraInDb,
} from '../repositories/camera-repository.js';

function nowCameraLabel() {
  const timeValue = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  return `Atualizado as ${timeValue}`;
}

export async function listCameras() {
  return listCamerasFromDb();
}

export async function findCameraById(id: string) {
  return findCameraByIdFromDb(id);
}

export async function createCamera(input: {
  name: string;
  location: string;
  unit: string;
  category: string;
  access: 'public' | 'restricted';
  status: 'live' | 'offline';
  quality: 'HD' | 'FHD' | '4K';
  description: string;
  image?: string;
  streamUrl?: string;
}) {
  const newCamera: CameraRecord = {
    id: await getNextCameraIdFromDb(),
    name: input.name.trim(),
    location: input.location.trim(),
    unit: input.unit.trim(),
    category: input.category.trim(),
    access: input.access,
    status: input.status,
    quality: input.quality,
    image:
      input.image?.trim() ||
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    streamUrl: input.streamUrl?.trim() || '',
    description: input.description.trim() || 'Camera cadastrada pela administracao.',
    updatedAt: nowCameraLabel(),
  };

  await insertCameraToDb(newCamera);
  return newCamera;
}

export async function updateCameraByAdmin(
  cameraId: string,
  input: {
    name?: string;
    location?: string;
    unit?: string;
    category?: string;
    access?: 'public' | 'restricted';
    status?: 'live' | 'offline';
    quality?: 'HD' | 'FHD' | '4K';
    description?: string;
    image?: string;
    streamUrl?: string;
  },
) {
  const camera = await findCameraById(cameraId);
  if (!camera) {
    return null;
  }

  if (typeof input.name === 'string' && input.name.trim().length > 0) {
    camera.name = input.name.trim();
  }

  if (typeof input.location === 'string' && input.location.trim().length > 0) {
    camera.location = input.location.trim();
  }

  if (typeof input.unit === 'string' && input.unit.trim().length > 0) {
    camera.unit = input.unit.trim();
  }

  if (typeof input.category === 'string' && input.category.trim().length > 0) {
    camera.category = input.category.trim();
  }

  if (typeof input.access === 'string') {
    camera.access = input.access;
  }

  if (typeof input.status === 'string') {
    camera.status = input.status;
  }

  if (typeof input.quality === 'string') {
    camera.quality = input.quality;
  }

  if (typeof input.description === 'string' && input.description.trim().length > 0) {
    camera.description = input.description.trim();
  }

  if (typeof input.image === 'string' && input.image.trim().length > 0) {
    camera.image = input.image.trim();
  }

  if (typeof input.streamUrl === 'string') {
    camera.streamUrl = input.streamUrl.trim();
  }

  camera.updatedAt = nowCameraLabel();
  const updatedCamera = await updateCameraInDb(camera);
  return updatedCamera ?? null;
}

export async function removeCameraByAdmin(cameraId: string) {
  return removeCameraFromDb(cameraId);
}
