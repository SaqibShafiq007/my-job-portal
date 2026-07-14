import { v4 as uuid } from 'uuid';
import db from '../../shared/db';
import type { CreateCompanyInput } from './companies.schema';


// ISOLATION RULE:Every piece of data belongs to someone specific, and the 
// server must only show it to that specific someone — never to anyone else, 
// even if they're a real, logged-in user of the same app. Every company-scoped
//  query must include company_id from
// the authenticated recruiter row (resolved via getRecruiterCompany), never
// from a URL parameter or request body. The recruiter cannot control which
// company_id is used to scope their queries.

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createCompany(
  userId: string,
  input: CreateCompanyInput,
): Promise<{ companyId: string; name: string }> {
  const companyId = uuid();
  const recruiterId = uuid();
  const slug = slugify(input.name) + '-' + companyId.slice(0, 8);

  await db.query('BEGIN');
  try {
    await db.query(
      `INSERT INTO companies (id, name, slug, website, verified)
       VALUES ($1, $2, $3, $4, false)`,
      [companyId, input.name, slug, input.website ?? null],
    );
    await db.query(
      `INSERT INTO recruiters (id, user_id, company_id, company_role, created_at)
       VALUES ($1, $2, $3, 'owner', NOW())`,
      [recruiterId, userId, companyId],
    );
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  return { companyId, name: input.name };
}

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