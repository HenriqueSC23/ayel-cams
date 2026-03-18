export type AuthRole = 'cliente' | 'administrador';
export type CameraAccess = 'public' | 'restricted';
export type CameraStatus = 'live' | 'offline';

export interface UserPreferences {
  notifyAlerts: boolean;
  prioritizeFavorites: boolean;
  rememberLastView: boolean;
  preferGridView: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  passwordHash: string;
  profile: 'Administrador' | 'Cliente';
  status: 'Ativo' | 'Inativo';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  lastAccess: string;
  unit: string;
  avatar: string;
  phone: string;
  company: string;
  jobTitle: string;
  preferences: UserPreferences;
}

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
  streamUrl: string;
  description: string;
  updatedAt: string;
}

export interface AuthSafeUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  profile: 'Administrador' | 'Cliente';
  status: 'Ativo' | 'Inativo';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  lastAccess: string;
  unit: string;
  avatar: string;
  phone: string;
  company: string;
  jobTitle: string;
  preferences: UserPreferences;
}
