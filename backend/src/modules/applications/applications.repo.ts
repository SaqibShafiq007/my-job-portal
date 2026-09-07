import db from '../../shared/db';

export async function findApplicationForCompany(
  applicationId: string,
  companyId: string,
) {
  const result = await db.query(
    `SELECT a.id, a.job_id, a.applicant_id, a.stage, a.created_at, a.updated_at
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1 AND j.company_id = $2`,
    [applicationId, companyId],
  );
  return result.rows[0] ?? null;
}

export async function updateApplicationStage(applicationId: string, stage: string) {
  const result = await db.query(
    `UPDATE applications SET stage = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, job_id, applicant_id, stage, created_at, updated_at`,
    [stage, applicationId],
  );
  return result.rows[0] ?? null;
}

export async function findApplicationWithApplicant(
  applicationId: string,
  companyId: string,
) {
  const result = await db.query(
    `SELECT
       a.id, a.job_id, a.applicant_id, a.stage,
       u.email AS applicant_email,
       j.title AS job_title
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN applicants ap ON ap.id = a.applicant_id
     JOIN users u ON u.id = ap.user_id
     WHERE a.id = $1 AND j.company_id = $2`,
    [applicationId, companyId],
  );
  return result.rows[0] ?? null;
}

export async function createInterview(
  applicationId: string,
  scheduledAt: Date,
  meetingLink: string,
  notes: string | null,
) {
  const result = await db.query(
    `INSERT INTO interviews (application_id, scheduled_at, meeting_link, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, application_id, scheduled_at, meeting_link, notes, outcome, created_at`,
    [applicationId, scheduledAt, meetingLink, notes],
  );
  return result.rows[0];
}