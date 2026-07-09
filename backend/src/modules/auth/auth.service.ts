// src/modules/auth/auth.service.ts
import { signAccessToken } from '../../shared/token.js';
import type { RegisterInput, LoginInput } from './auth.schema';
import { hashPassword, verifyPassword } from '../../shared/password';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import crypto from 'node:crypto';
import { config } from '../../shared/config';
import {
  findUserByEmail,
  createUser,
  createRefreshToken,
  findRefreshTokenByHash,
  deleteRefreshTokenByHash,
  deleteAllRefreshTokensForUser,
  findUserById,
} from './auth.repo';



// A pre-computed bcrypt hash of a throwaway string.
// Used in the login path when no user is found, so the timing cost of
// bcrypt.compare is always paid regardless of whether the email exists.
// Generate with: node -e "require('bcryptjs').hash('__dummy__',12).then(console.log)"
const DUMMY_HASH =
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zLklGLsR9XFKQZ5kQlbri';

export async function register(
  input: RegisterInput,
): Promise<{ id: string; email: string; role: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('Email already taken');
  }

  const passwordHash = await hashPassword(input.password);
  return createUser(input.email, passwordHash, input.role);
}

export async function login(
  input: LoginInput,
): Promise<{ id: string; email: string; role: string; accessToken: string; refreshToken: string }> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    await verifyPassword(input.password, DUMMY_HASH);
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('Account suspended');
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role);

  return { id: user.id, email: user.email, role: user.role, accessToken, refreshToken };
}




async function issueTokenPair(
  userId: string,
  role: 'admin' | 'recruiter' | 'applicant',
): Promise<{ accessToken: string; refreshToken: string }> {

  // Generate 256 bits of cryptographically random data.
  // toString('hex') produces a 64-character hex string.
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');

  // Hash the raw token before storing. SHA-256 of a 256-bit random value
  // is collision-resistant and cannot be reversed to obtain the raw token.
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  // Date.now() is in milliseconds; multiply days → hours → minutes → seconds → ms.
  const expiresAt = new Date(
    Date.now() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );

  await createRefreshToken(userId, tokenHash, expiresAt);

  const accessToken = signAccessToken({ sub: userId, role });

  return { accessToken, refreshToken: rawRefreshToken };
}

export async function refresh(
  rawToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // Hash the incoming raw token the same way it was hashed at creation.
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Look up the hash. Returns null if the token does not exist or has expired.
  const tokenRow = await findRefreshTokenByHash(hash);
  if (!tokenRow) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Find the user to get their current role. The role in the DB may have
  // changed since the token was issued — always re-read from the source.
  const user = await findUserById(tokenRow.user_id);
  if (!user || user.status !== 'active') {
    // The user was deleted or suspended since this token was issued.
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Rotate: delete the old token hash before issuing a new pair.
  // If deleteRefreshTokenByHash succeeds and createRefreshToken (inside
  // issueTokenPair) fails, the user must log in again — acceptable.
  // Note: a concurrent request presenting the same token can call
  // findRefreshTokenByHash between this delete and the insert, and both
  // requests may issue new tokens. For a production system, a single
  // DELETE...RETURNING statement (find-and-delete atomically) eliminates
  // this race. For this course, the delete-first approach is used for clarity.
  await deleteRefreshTokenByHash(hash);

  return issueTokenPair(user.id, user.role);
}



export async function logout(rawToken: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Delete the row. If it does not exist (already deleted, expired, or
  // the token is unknown), the DELETE affects 0 rows. Return normally either
  // way — logout is idempotent. Throwing here would punish correct client
  // behaviour (retrying logout after a network failure).
  await deleteRefreshTokenByHash(hash);
}

