import type { AuthRole, AuthUser } from '../types/domain-types.js';
import { query } from '../db/client.js';

interface UserRow {
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
  preferences: AuthUser['preferences'];
}

const selectUserColumns = `
  SELECT
    id,
    name,
    email,
    role,
    password_hash AS "passwordHash",
    profile,
    status,
    access,
    last_access AS "lastAccess",
    unit,
    avatar,
    phone,
    company,
    job_title AS "jobTitle",
    preferences
  FROM users
`;

function mapUserRow(row: UserRow): AuthUser {
  return {
    ...row,
    preferences: {
      notifyAlerts: Boolean(row.preferences?.notifyAlerts),
      prioritizeFavorites: Boolean(row.preferences?.prioritizeFavorites),
      rememberLastView: Boolean(row.preferences?.rememberLastView),
      preferGridView: Boolean(row.preferences?.preferGridView),
    },
  };
}

export async function listUsersFromDb() {
  const result = await query<UserRow>(`${selectUserColumns} ORDER BY name ASC`);
  return result.rows.map(mapUserRow);
}

export async function findUserByEmailFromDb(email: string) {
  const result = await query<UserRow>(`${selectUserColumns} WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : undefined;
}

export async function findUserByIdFromDb(id: string) {
  const result = await query<UserRow>(`${selectUserColumns} WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : undefined;
}

export async function insertUserToDb(user: AuthUser) {
  await query(
    `
      INSERT INTO users (
        id,
        name,
        email,
        role,
        password_hash,
        profile,
        status,
        access,
        last_access,
        unit,
        avatar,
        phone,
        company,
        job_title,
        preferences
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
      )
    `,
    [
      user.id,
      user.name,
      user.email,
      user.role,
      user.passwordHash,
      user.profile,
      user.status,
      user.access,
      user.lastAccess,
      user.unit,
      user.avatar,
      user.phone,
      user.company,
      user.jobTitle,
      JSON.stringify(user.preferences),
    ],
  );

  return user;
}

export async function updateUserInDb(user: AuthUser) {
  const result = await query<UserRow>(
    `
      UPDATE users
      SET
        name = $2,
        email = $3,
        role = $4,
        password_hash = $5,
        profile = $6,
        status = $7,
        access = $8,
        last_access = $9,
        unit = $10,
        avatar = $11,
        phone = $12,
        company = $13,
        job_title = $14,
        preferences = $15::jsonb,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        email,
        role,
        password_hash AS "passwordHash",
        profile,
        status,
        access,
        last_access AS "lastAccess",
        unit,
        avatar,
        phone,
        company,
        job_title AS "jobTitle",
        preferences
    `,
    [
      user.id,
      user.name,
      user.email,
      user.role,
      user.passwordHash,
      user.profile,
      user.status,
      user.access,
      user.lastAccess,
      user.unit,
      user.avatar,
      user.phone,
      user.company,
      user.jobTitle,
      JSON.stringify(user.preferences),
    ],
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

export async function removeUserFromDb(userId: string) {
  const result = await query('DELETE FROM users WHERE id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function countAdministratorsFromDb() {
  const result = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE role = 'administrador'`);

  return Number(result.rows[0]?.count || '0');
}

export async function getNextUserIdFromDb() {
  const result = await query<{ nextId: number }>(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM '[0-9]+$') AS INTEGER)), 0) + 1 AS "nextId"
      FROM users
    `,
  );

  return `usr-${String(result.rows[0]?.nextId || 1).padStart(3, '0')}`;
}
