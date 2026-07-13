import db from '../../shared/db';

export interface RecruiterCompany {
  companyId: string;
  companyRole: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  verified: boolean;
}

/**
 * Resolves the company_id and company_role for a given user.
 * Returns null if the user has no row in the recruiters table —
 * meaning they are not associated with any company.
 *
 * The userId comes from the verified JWT (req.user.userId).
 * This function is the bridge between the JWT and the company scope.
 */
export async function getRecruiterCompany(
  userId: string,
): Promise<RecruiterCompany | null> {
  const result = await db.query<{ company_id: string; company_role: string }>(
    `SELECT r.company_id, r.company_role
     FROM recruiters r
     WHERE r.user_id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    companyId: result.rows[0].company_id,
    companyRole: result.rows[0].company_role,
  };
}

/**
 * Fetches company details by id.
 * This query is always called with a companyId resolved from
 * getRecruiterCompany — never from a URL parameter directly.
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  const result = await db.query<{
    id: string;
    name: string;
    slug: string;
    website: string | null;
    verified: boolean;
  }>(
    `SELECT id, name, slug, website, verified
     FROM companies
     WHERE id = $1`,
    [companyId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}