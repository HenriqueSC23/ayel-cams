import type { AuthRole, AuthSafeUser, AuthUser, CameraRecord, UserPreferences } from '../types/domain-types.js';
import { hashPassword, verifyPassword } from '../lib/password-hash.js';

const defaultPreferences: UserPreferences = {
  notifyAlerts: true,
  prioritizeFavorites: true,
  rememberLastView: true,
  preferGridView: true,
};

const users: AuthUser[] = [
  {
    id: 'usr-001',
    name: 'Carlos Souza',
    email: 'admin@ayel.com.br',
    role: 'administrador',
    passwordHash: '$2b$12$USyP3FoK7KwHcYyCdV9VN.xnUP.J52bBVFzXe4a4DxjxWuiILlK6S',
    profile: 'Administrador',
    status: 'Ativo',
    access: 'Administrador',
    lastAccess: 'Hoje, 08:30',
    unit: 'Matriz',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
    phone: '+55 (11) 99876-4521',
    company: 'Ayel Seguranca Patrimonial',
    jobTitle: 'Gestor de Operacoes',
    preferences: { ...defaultPreferences },
  },
  {
    id: 'usr-002',
    name: 'Mariana Lima',
    email: 'mariana.lima@ayel.com.br',
    role: 'cliente',
    passwordHash: '$2b$12$XOfm9oD2YcJRbZ7yZzxcr.XgmaRFbN.RHHydlMn.GU2Aw.2nJgNhq',
    profile: 'Cliente',
    status: 'Ativo',
    access: 'Area restrita',
    lastAccess: 'Hoje, 10:15',
    unit: 'Filial Sul',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80',
    phone: '+55 (11) 97777-2211',
    company: 'Ayel Seguranca Patrimonial',
    jobTitle: 'Analista de Monitoramento',
    preferences: { ...defaultPreferences },
  },
  {
    id: 'usr-003',
    name: 'Joao Martins',
    email: 'joao.m@cliente.com',
    role: 'cliente',
    passwordHash: '$2b$12$PRCq7.WvOoS/i3gqmZqFm.NBZLYVH102nAGh3cJ6ujwcNHsTrdmRG',
    profile: 'Cliente',
    status: 'Inativo',
    access: 'Sem acesso',
    lastAccess: '12/03/2026',
    unit: 'Matriz',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    phone: '+55 (11) 96666-3322',
    company: 'Cliente Externo LTDA',
    jobTitle: 'Coordenador de Logistica',
    preferences: { ...defaultPreferences },
  },
  {
    id: 'usr-004',
    name: 'Fernanda Rocha',
    email: 'fernanda.r@ayel.com.br',
    role: 'administrador',
    passwordHash: '$2b$12$bkTL793x9ZOi1Dmj5sP3L.wLDNtWflLr1PSNYbYjb57woF3P9eBkO',
    profile: 'Administrador',
    status: 'Ativo',
    access: 'Administrador',
    lastAccess: 'Hoje, 11:42',
    unit: 'Filial Norte',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    phone: '+55 (11) 95555-9988',
    company: 'Ayel Seguranca Patrimonial',
    jobTitle: 'Coordenadora de Seguranca',
    preferences: { ...defaultPreferences },
  },
];

const cameras: CameraRecord[] = [
  {
    id: 'cam-001',
    name: 'Portaria Centro Historico',
    location: 'Entrada principal - cidade historica',
    unit: 'Porto Seguro - Centro',
    category: 'Portaria',
    access: 'public',
    status: 'live',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1706476746683-1222454323f7?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Controle de entrada de visitantes no nucleo operacional do centro historico.',
    updatedAt: 'Atualizado as 18:32',
  },
  {
    id: 'cam-002',
    name: 'Recepcao Terminal Maritimo',
    location: 'Terminal maritimo - recepcao principal',
    unit: 'Porto Seguro - Orla',
    category: 'Recepcao',
    access: 'public',
    status: 'live',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1677272292936-8d9d6e714c2d?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Fluxo de atendimento e credenciamento de embarque na orla.',
    updatedAt: 'Atualizado as 18:30',
  },
  {
    id: 'cam-003',
    name: 'Estacionamento Orla Norte',
    location: 'Patio externo - vagas visitantes',
    unit: 'Porto Seguro - Orla Norte',
    category: 'Estacionamento',
    access: 'public',
    status: 'live',
    quality: 'HD',
    image: 'https://images.unsplash.com/photo-1691476093416-9af529cf296d?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Cobertura de patio externo com foco no giro de veiculos da orla norte.',
    updatedAt: 'Atualizado as 18:21',
  },
  {
    id: 'cam-004',
    name: 'Passarela do Descobrimento',
    location: 'Entrada lateral de servicos',
    unit: 'Porto Seguro - Centro',
    category: 'Portaria',
    access: 'public',
    status: 'live',
    quality: 'HD',
    image: 'https://images.unsplash.com/photo-1717501218555-1cb73ec83766?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Monitoramento de entrada lateral em area de alto fluxo turistico.',
    updatedAt: 'Atualizado as 18:34',
  },
  {
    id: 'cam-005',
    name: 'Patio Externo Cidade Historica',
    location: 'Area externa de circulacao',
    unit: 'Porto Seguro - Centro',
    category: 'Estacionamento',
    access: 'public',
    status: 'offline',
    quality: 'HD',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    streamUrl: '',
    description: 'Cobertura de patio externo com indisponibilidade temporaria de sinal.',
    updatedAt: 'Sem sinal desde 18:04',
  },
  {
    id: 'cam-006',
    name: 'Corredor Administrativo Arraial',
    location: 'Bloco administrativo - acesso controlado',
    unit: 'Porto Seguro - Arraial',
    category: 'Administrativo',
    access: 'restricted',
    status: 'live',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1637665637343-d497d345ed2f?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Corredor interno com acesso exclusivo para equipe autorizada.',
    updatedAt: 'Atualizado as 18:28',
  },
  {
    id: 'cam-007',
    name: 'Galpao Logistico BR-367',
    location: 'Estoque A - operacao noturna',
    unit: 'Porto Seguro - BR-367',
    category: 'Galpao',
    access: 'restricted',
    status: 'live',
    quality: '4K',
    image: 'https://images.unsplash.com/photo-1610463076431-2717271d692d?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Cobertura da movimentacao de carga no galpao logistico da BR-367.',
    updatedAt: 'Atualizado as 18:16',
  },
  {
    id: 'cam-008',
    name: 'Doca de Carga Porto Seguro',
    location: 'Distrito industrial - doca principal',
    unit: 'Porto Seguro - Distrito Industrial',
    category: 'Galpao',
    access: 'restricted',
    status: 'live',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Supervisao em tempo real do embarque e descarga na doca principal.',
    updatedAt: 'Atualizado as 18:35',
  },
  {
    id: 'cam-009',
    name: 'Recepcao Tecnica Aeroporto',
    location: 'Terminal de apoio operacional',
    unit: 'Porto Seguro - Aeroporto',
    category: 'Recepcao',
    access: 'restricted',
    status: 'live',
    quality: 'HD',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Acesso tecnico para equipes credenciadas em area sensivel.',
    updatedAt: 'Atualizado as 18:12',
  },
  {
    id: 'cam-010',
    name: 'Sala Cofre CFTV',
    location: 'Nucleo de seguranca eletronica',
    unit: 'Porto Seguro - Centro',
    category: 'Administrativo',
    access: 'restricted',
    status: 'offline',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    streamUrl: '',
    description: 'Ambiente critico de seguranca com falha de comunicacao em diagnostico.',
    updatedAt: 'Sem sinal desde 17:48',
  },
  {
    id: 'cam-011',
    name: 'Entrada Lateral Operacional',
    location: 'Acesso lateral de manutencao',
    unit: 'Porto Seguro - Centro',
    category: 'Portaria',
    access: 'restricted',
    status: 'live',
    quality: 'HD',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Ponto lateral com controle de credenciais para equipe de operacao.',
    updatedAt: 'Atualizado as 18:27',
  },
  {
    id: 'cam-012',
    name: 'Area Externa Doca Sul',
    location: 'Patio externo - doca sul',
    unit: 'Porto Seguro - Distrito Industrial',
    category: 'Estacionamento',
    access: 'restricted',
    status: 'live',
    quality: 'FHD',
    image: 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&w=1200&q=80',
    streamUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Cobertura de patio externo e perimetro logistico da doca sul.',
    updatedAt: 'Atualizado as 18:14',
  },
];

function toSafeUser(user: AuthUser): AuthSafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function nextUserId() {
  const nextId = users.length + 1;
  return `usr-${String(nextId).padStart(3, '0')}`;
}

function nextCameraId() {
  const nextId = cameras.length + 1;
  return `cam-${String(nextId).padStart(3, '0')}`;
}

function nowLabel() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
}

function nowCameraLabel() {
  const timeValue = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  return `Atualizado as ${timeValue}`;
}

function updatePreferences(user: AuthUser, partialPreferences: Partial<UserPreferences>) {
  user.preferences = {
    ...user.preferences,
    ...partialPreferences,
  };
}

export function listUsers() {
  return users.map(toSafeUser);
}

export function listCameras() {
  return cameras;
}

export function findCameraById(id: string) {
  return cameras.find((camera) => camera.id === id);
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string) {
  return users.find((user) => user.id === id);
}

export function registerUser(input: { fullName: string; email: string; password: string; role?: AuthRole }) {
  const role = input.role ?? 'cliente';
  const access = role === 'administrador' ? 'Administrador' : 'Area restrita';
  const profile = role === 'administrador' ? 'Administrador' : 'Cliente';

  const newUser: AuthUser = {
    id: nextUserId(),
    name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    role,
    profile,
    status: 'Ativo',
    access,
    lastAccess: nowLabel(),
    unit: 'Matriz',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    phone: '',
    company: 'Ayel Seguranca Patrimonial',
    jobTitle: role === 'administrador' ? 'Administrador da plataforma' : 'Cliente corporativo',
    preferences: { ...defaultPreferences },
  };

  users.push(newUser);
  return toSafeUser(newUser);
}

export function createUserByAdmin(input: {
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
  status: 'Ativo' | 'Inativo';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  unit: string;
}) {
  const profile = input.role === 'administrador' ? 'Administrador' : 'Cliente';

  const newUser: AuthUser = {
    id: nextUserId(),
    name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    role: input.role,
    profile,
    status: input.status,
    access: input.access,
    lastAccess: 'Nunca acessou',
    unit: input.unit,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    phone: '',
    company: 'Ayel Seguranca Patrimonial',
    jobTitle: profile === 'Administrador' ? 'Administrador da plataforma' : 'Cliente corporativo',
    preferences: { ...defaultPreferences },
  };

  users.unshift(newUser);
  return toSafeUser(newUser);
}

export function updateUserByAdmin(
  userId: string,
  input: {
    fullName?: string;
    email?: string;
    password?: string;
    role?: AuthRole;
    status?: 'Ativo' | 'Inativo';
    access?: 'Administrador' | 'Area restrita' | 'Sem acesso';
    unit?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    preferences?: Partial<UserPreferences>;
  },
) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  if (typeof input.fullName === 'string' && input.fullName.trim().length > 0) {
    user.name = input.fullName.trim();
  }

  if (typeof input.email === 'string' && input.email.trim().length > 0) {
    user.email = input.email.trim().toLowerCase();
  }

  if (typeof input.password === 'string' && input.password.length > 0) {
    user.passwordHash = hashPassword(input.password);
  }

  if (typeof input.role === 'string') {
    user.role = input.role;
    user.profile = input.role === 'administrador' ? 'Administrador' : 'Cliente';
  }

  if (typeof input.status === 'string') {
    user.status = input.status;
  }

  if (typeof input.access === 'string') {
    user.access = input.access;
  }

  if (typeof input.unit === 'string' && input.unit.trim().length > 0) {
    user.unit = input.unit.trim();
  }

  if (typeof input.phone === 'string') {
    user.phone = input.phone.trim();
  }

  if (typeof input.company === 'string' && input.company.trim().length > 0) {
    user.company = input.company.trim();
  }

  if (typeof input.jobTitle === 'string' && input.jobTitle.trim().length > 0) {
    user.jobTitle = input.jobTitle.trim();
  }

  if (input.preferences) {
    updatePreferences(user, input.preferences);
  }

  return toSafeUser(user);
}

export function updateOwnUserProfile(
  userId: string,
  input: {
    fullName?: string;
    email?: string;
    unit?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    preferences?: Partial<UserPreferences>;
  },
) {
  return updateUserByAdmin(userId, input);
}

export function changeOwnUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = findUserById(userId);
  if (!user) {
    return { ok: false as const, reason: 'not-found' as const };
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false as const, reason: 'invalid-current-password' as const };
  }

  user.passwordHash = hashPassword(newPassword);
  return { ok: true as const };
}

export function removeUserByAdmin(userId: string) {
  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex === -1) {
    return false;
  }

  users.splice(userIndex, 1);
  return true;
}

export function countAdministrators() {
  return users.filter((user) => user.role === 'administrador').length;
}

export function createCamera(input: {
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
    id: nextCameraId(),
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

  cameras.unshift(newCamera);
  return newCamera;
}

export function updateCameraByAdmin(
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
  const camera = findCameraById(cameraId);
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
  return camera;
}

export function removeCameraByAdmin(cameraId: string) {
  const cameraIndex = cameras.findIndex((camera) => camera.id === cameraId);
  if (cameraIndex === -1) {
    return false;
  }

  cameras.splice(cameraIndex, 1);
  return true;
}

export function touchUserAccess(userId: string) {
  const user = findUserById(userId);
  if (!user) {
    return;
  }

  user.lastAccess = nowLabel();
}
