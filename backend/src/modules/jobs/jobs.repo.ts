import db from '../../shared/db';
import { NotFoundError } from '../../shared/errors';

/**
 * Asserts that the job identified by jobId belongs to companyId.
 *
 * Throws NotFoundError if:
 *   - No job row exists with that id.
 *   - The job's company_id does not match companyId.
 *
 * Both failure cases return 404, not 403. Returning 404 avoids
 * confirming to the caller that the resource exists — an attacker
 * probing UUIDs learns nothing from the response.
 *
 * companyId must come from getRecruiterCompany(req.user.userId),
 * never from the URL or request body.
 */
export async function assertJobOwnership(
  jobId: string,
  companyId: string,
): Promise<void> {
  const result = await db.query<{ id: string; company_id: string }>(
    `SELECT id, company_id FROM jobs WHERE id = $1`,
    [jobId],
  );

  if (result.rows.length === 0 || result.rows[0].company_id !== companyId) {
    throw new NotFoundError('Job not found');
  }
}