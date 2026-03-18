import bcrypt from 'bcryptjs';

const defaultSaltRounds = 12;

function getSaltRounds() {
  const configuredValue = Number(process.env.PASSWORD_SALT_ROUNDS);

  if (!Number.isInteger(configuredValue) || configuredValue < 8) {
    return defaultSaltRounds;
  }

  return configuredValue;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, getSaltRounds());
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}
