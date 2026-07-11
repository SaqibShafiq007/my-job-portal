// src/modules/auth/auth.repo.ts
import db from '../../shared/db';

export interface UserRow {
  id:            string;
  email:         string;
  password_hash: string;
  role:          'admin' | 'recruiter' | 'applicant';
  status:        'active' | 'inactive' | 'pending' | 'suspended';
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await db.query<UserRow>(
    'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email:        string,
  passwordHash: string,
  role:         'recruiter' | 'applicant',
): Promise<{ id: string; email: string; role: string }> {
  const { rows } = await db.query<{ id: string; email: string; role: string }>(
    `INSERT INTO users (email, password_hash, role, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id, email, role`,
    [email, passwordHash, role],
  );
  return rows[0];
}

// --- Refresh token functions ---

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export interface RefreshTokenRow {
  id:         string;
  user_id:    string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export async function findRefreshTokenByHash(
  hash: string,
): Promise<RefreshTokenRow | null> {
  const result = await db.query<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1
       AND expires_at > NOW()`,
    [hash],
  );
  return result.rows[0] ?? null;
}

export async function deleteRefreshTokenByHash(hash: string): Promise<void> {
  await db.query(
    `DELETE FROM refresh_tokens WHERE token_hash = $1`,
    [hash],
  );
}

export async function deleteAllRefreshTokensForUser(userId: string): Promise<void> {
  await db.query(
    `DELETE FROM refresh_tokens WHERE user_id = $1`,
    [userId],
  );
}


export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await db.query<UserRow>(
    `SELECT id, email, role, status FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}


// --- Email verification functions ---

// Delete any existing OTP rows for this user, then insert a new one.
// Two operations keep the logic explicit; a UNIQUE constraint would error
// on the second request instead of silently replacing the old OTP.
export async function createEmailVerification(
  userId: string,
  otpHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.query(
    `DELETE FROM email_verifications WHERE user_id = $1`,
    [userId],
  );
  await db.query(
    `INSERT INTO email_verifications (user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, otpHash, expiresAt],
  );
}

export interface EmailVerificationRow {
  id:         string;
  user_id:    string;
  otp_hash:   string;
  expires_at: Date;
  created_at: Date;
}

// Returns null if no row exists OR if the row has expired — caller cannot distinguish.
export async function findEmailVerification(
  userId: string,
): Promise<EmailVerificationRow | null> {
  const result = await db.query<EmailVerificationRow>(
    `SELECT id, user_id, otp_hash, expires_at, created_at
     FROM email_verifications
     WHERE user_id = $1
       AND expires_at > NOW()`,
    [userId],
  );
  return result.rows[0] ?? null;
}

// Delete all OTP rows for a user — called after verification and before resend.
export async function deleteEmailVerificationsForUser(userId: string): Promise<void> {
  await db.query(
    `DELETE FROM email_verifications WHERE user_id = $1`,
    [userId],
  );
}

// Activate a user account after successful email verification.
export async function activateUser(userId: string): Promise<void> {
  await db.query(
    `UPDATE users SET status = 'active' WHERE id = $1`,
    [userId],
  );
}