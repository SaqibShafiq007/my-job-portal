// src/worker/handlers/cleanupExpiredTokens.ts
import db from '../../shared/db';

// Deletes refresh token rows that have passed their expiry time.
export async function cleanupExpiredTokens(): Promise<void> {
  const result = await db.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`);
  console.log(`[cleanup] Deleted ${result.rowCount} expired refresh token rows`);
}