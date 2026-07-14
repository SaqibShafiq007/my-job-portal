import db  from '../../shared/db';
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