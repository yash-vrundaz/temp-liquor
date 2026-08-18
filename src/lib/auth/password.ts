import bcrypt from "bcryptjs";

const MIN_LENGTH = 8;

export function validatePassword(password: string) {
  if (password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include a letter and a number.";
  }
  return null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
