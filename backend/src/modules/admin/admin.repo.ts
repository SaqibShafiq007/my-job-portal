import db from '../../shared/db';

export async function listCompanies(filter?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter === 'verified') {
    conditions.push(`c.verified = true`);
  } else if (filter === 'suspended') {
    conditions.push(`c.suspended = true`);
  } else if (filter === 'pending') {
    conditions.push(`c.verified = false AND c.suspended = false`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT c.id, c.name, c.verified, c.suspended, c.created_at, u.email AS owner_email
     FROM companies c
     LEFT JOIN recruiters r ON r.company_id = c.id AND r.company_role = 'owner'
     LEFT JOIN users u ON u.id = r.user_id
     ${where}
     ORDER BY c.created_at DESC`,
    params,
  );
  return result.rows;
}

export async function findCompanyById(id: string) {
  const result = await db.query(
    `SELECT id, name, verified, suspended FROM companies WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function setCompanyVerified(id: string, verified: boolean) {
  const result = await db.query(
    `UPDATE companies SET verified = $1 WHERE id = $2
     RETURNING id, name, verified, suspended`,
    [verified, id],
  );
  return result.rows[0] ?? null;
}

export async function setCompanySuspended(id: string, suspended: boolean) {
  const result = await db.query(
    `UPDATE companies SET suspended = $1 WHERE id = $2
     RETURNING id, name, verified, suspended`,
    [suspended, id],
  );
  return result.rows[0] ?? null;
}

export async function closeOpenJobsForCompany(companyId: string) {
  await db.query(
    `UPDATE jobs SET status = 'closed'
     WHERE company_id = $1 AND status = 'open'`,
    [companyId],
  );
}