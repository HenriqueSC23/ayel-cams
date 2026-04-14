export type CameraAccess = 'public' | 'restricted';
export type CameraStatus = 'live' | 'offline';
export type ViewMode = 'grid' | 'list';

export interface CameraRecord {
  id: string;
  name: string;
  location: string;
  unit: string;
  category: string;
  access: CameraAccess;
  status: CameraStatus;
  quality: 'HD' | 'FHD' | '4K';
  image: string;
  hasStream: boolean;
  description: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  profile: 'Administrador' | 'Cliente';
  status: 'Ativo' | 'Inativo';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  lastAccess: string;
  unit: string;
  avatar: string;
}

export const cameraFilters = [
  'Todas',
  'Publicas',
  'Restritas',
  'Ao vivo',
  'Offline',
  'Portaria',
  'Recepcao',
  'Estacionamento',
  'Administrativo',
  'Galpao',
] as const;

export const publicCameraFilters = ['Todas', 'Ao vivo', 'Offline', 'Portaria', 'Recepcao', 'Estacionamento'] as const;

export const restrictedAreaFilters = [
  'Todas',
  'Restritas',
  'Ao vivo',
  'Offline',
  'Portaria',
  'Recepcao',
  'Estacionamento',
  'Administrativo',
  'Galpao',
  'Entrada lateral',
  'Area externa',
] as const;

export const userFilters = ['Todos', 'Administradores', 'Clientes', 'Ativos', 'Inativos'] as const;

export function normalizeValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesCameraFilter(camera: CameraRecord, filter: string) {
  const normalizedFilter = normalizeValue(filter);

  switch (normalizedFilter) {
    case 'todas':
      return true;
    case 'publicas':
      return camera.access === 'public';
    case 'restritas':
      return camera.access === 'restricted';
    case 'ao vivo':
      return camera.status === 'live';
    case 'offline':
      return camera.status === 'offline';
    case 'entrada lateral':
      return normalizeValue(camera.name).includes('lateral') || normalizeValue(camera.location).includes('lateral');
    case 'area externa':
      return (
        normalizeValue(camera.location).includes('externa') ||
        normalizeValue(camera.location).includes('patio') ||
        normalizeValue(camera.description).includes('externa') ||
        normalizeValue(camera.description).includes('patio')
      );
    default:
      return normalizeValue(camera.category) === normalizedFilter;
  }
}

export function filterCameraRecords(catalog: CameraRecord[], query: string, activeFilter: string) {
  const normalizedQuery = normalizeValue(query);

  return catalog.filter((camera) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      normalizeValue([camera.name, camera.location, camera.unit, camera.category, camera.description].join(' ')).includes(normalizedQuery);

    return matchesSearch && matchesCameraFilter(camera, activeFilter);
  });
}

export function getCameraSummary(catalog: CameraRecord[]) {
  return {
    total: catalog.length,
    live: catalog.filter((camera) => camera.status === 'live').length,
    offline: catalog.filter((camera) => camera.status === 'offline').length,
    public: catalog.filter((camera) => camera.access === 'public').length,
    restricted: catalog.filter((camera) => camera.access === 'restricted').length,
  };
}

export function matchesUserFilter(user: UserRecord, filter: string) {
  switch (filter) {
    case 'Todos':
      return true;
    case 'Administradores':
      return user.profile === 'Administrador';
    case 'Clientes':
      return user.profile === 'Cliente';
    case 'Ativos':
      return user.status === 'Ativo';
    case 'Inativos':
      return user.status === 'Inativo';
    default:
      return true;
  }
}
