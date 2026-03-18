import type { AuthRole, AuthSafeUser, AuthUser, UserPreferences } from '../types/domain-types.js';
import { hashPassword, verifyPassword } from '../lib/password-hash.js';
import {
  countAdministratorsFromDb,
  findUserByEmailFromDb,
  findUserByIdFromDb,
  getNextUserIdFromDb,
  insertUserToDb,
  listUsersFromDb,
  removeUserFromDb,
  updateUserInDb,
} from '../repositories/user-repository.js';

const defaultPreferences: UserPreferences = {
  notifyAlerts: true,
  prioritizeFavorites: true,
  rememberLastView: true,
  preferGridView: true,
};

function toSafeUser(user: AuthUser): AuthSafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function nowLabel() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
}

function updatePreferences(user: AuthUser, partialPreferences: Partial<UserPreferences>) {
  user.preferences = {
    ...user.preferences,
    ...partialPreferences,
  };
}

export async function listUsers() {
  const users = await listUsersFromDb();
  return users.map(toSafeUser);
}

export async function findUserByEmail(email: string) {
  return findUserByEmailFromDb(email);
}

export async function findUserById(id: string) {
  return findUserByIdFromDb(id);
}

export async function registerUser(input: { fullName: string; email: string; password: string; role?: AuthRole }) {
  const role = input.role ?? 'cliente';
  const access = role === 'administrador' ? 'Administrador' : 'Area restrita';
  const profile = role === 'administrador' ? 'Administrador' : 'Cliente';

  const newUser: AuthUser = {
    id: await getNextUserIdFromDb(),
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

  await insertUserToDb(newUser);
  return toSafeUser(newUser);
}

export async function createUserByAdmin(input: {
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
    id: await getNextUserIdFromDb(),
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

  await insertUserToDb(newUser);
  return toSafeUser(newUser);
}

export async function updateUserByAdmin(
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
  const user = await findUserById(userId);
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

  const updatedUser = await updateUserInDb(user);
  if (!updatedUser) {
    return null;
  }

  return toSafeUser(updatedUser);
}

export async function updateOwnUserProfile(
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

export async function changeOwnUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await findUserById(userId);
  if (!user) {
    return { ok: false as const, reason: 'not-found' as const };
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false as const, reason: 'invalid-current-password' as const };
  }

  user.passwordHash = hashPassword(newPassword);
  await updateUserInDb(user);
  return { ok: true as const };
}

export async function removeUserByAdmin(userId: string) {
  return removeUserFromDb(userId);
}

export async function countAdministrators() {
  return countAdministratorsFromDb();
}

export async function touchUserAccess(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    return;
  }

  user.lastAccess = nowLabel();
  await updateUserInDb(user);
}
