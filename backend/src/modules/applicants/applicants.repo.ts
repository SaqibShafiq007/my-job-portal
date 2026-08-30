import db from '../../shared/db';
import { NotFoundError } from '../../shared/errors';

/**
 * Asserts that the applicant record identified by applicantId belongs
 * to the user identified by userId (from req.user.userId).
 *
 * Throws NotFoundError if:
 *   - No applicant row exists with that id.
 *   - The applicant's user_id does not match userId.
 *
 * Returns 404 in both cases to avoid confirming the record's existence.
 */
export async function assertApplicantOwnership(
  applicantId: string,
  userId: string,
): Promise<void> {
  const result = await db.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM applicants WHERE id = $1`,
    [applicantId],
  );

  if (result.rows.length === 0 || result.rows[0].user_id !== userId) {
    throw new NotFoundError('Applicant not found');
  }
}

export async function createApplicantProfile(
  userId: string,
  fullName: string,
  headline: string | undefined,
  location: string | undefined,
  attributes: Record<string, unknown>,
) {
  const result = await db.query(
    `INSERT INTO applicants (user_id, full_name, headline, location, attributes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, full_name, headline, location, attributes, created_at`,
    [userId, fullName, headline ?? null, location ?? null, JSON.stringify(attributes ?? {})],
  );
  return result.rows[0];
}

export async function findApplicantByUserId(userId: string) {
  const result = await db.query(
    `SELECT id, user_id, full_name, headline, location, attributes, created_at
     FROM applicants WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function updateApplicantProfile(
  applicantId: string,
  fields: {
    full_name?: string;
    headline?: string;
    location?: string;
    attributes?: Record<string, unknown>;
  },
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (fields.full_name !== undefined) {
    sets.push(`full_name = $${i++}`);
    values.push(fields.full_name);
  }
  if (fields.headline !== undefined) {
    sets.push(`headline = $${i++}`);
    values.push(fields.headline);
  }
  if (fields.location !== undefined) {
    sets.push(`location = $${i++}`);
    values.push(fields.location);
  }
  if (fields.attributes !== undefined) {
    sets.push(`attributes = $${i++}`);
    values.push(JSON.stringify(fields.attributes));
  }

  if (sets.length === 0) return null;

  values.push(applicantId);
  const result = await db.query(
    `UPDATE applicants SET ${sets.join(', ')}
     WHERE id = $${i}
     RETURNING id, user_id, full_name, headline, location, attributes, created_at`,
    values,
  );
  return result.rows[0] ?? null;
}