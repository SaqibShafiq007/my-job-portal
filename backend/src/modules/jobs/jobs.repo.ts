import db from '../../shared/db';
import { NotFoundError } from '../../shared/errors';

// ISOLATION RULE:Every piece of data belongs to someone specific, and the 
// server must only show it to that specific someone — never to anyone else, 
// even if they're a real, logged-in user of the same app. Every company-scoped
//  query must include company_id from
// the authenticated recruiter row (resolved via getRecruiterCompany), never
// from a URL parameter or request body. The recruiter cannot control which
// company_id is used to scope their queries.





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