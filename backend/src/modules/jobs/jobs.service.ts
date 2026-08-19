import { ForbiddenError } from '../../shared/errors';
import { getRecruiterCompany } from '../companies/companies.repo';
import { assertCompanyRole } from '../companies/companies.service';
import { assertJobOwnership, createJob, updateJob, setJobStatus } from './jobs.repo';
import type { CreateJobInput } from './jobs.schema';


const JOB_POSTERS = ['owner', 'hr_manager', 'recruiter'] as const;

export async function postJob(userId: string, input: CreateJobInput) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  assertCompanyRole(company.companyRole, [...JOB_POSTERS]);

  const jobId = await createJob(company.companyId, input);
  return { jobId };
}

export async function editJob(
  userId: string,
  jobId: string,
  input: Partial<CreateJobInput>,
) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  assertCompanyRole(company.companyRole, [...JOB_POSTERS]);

  // Confirm the job belongs to this company (throws NotFoundError if not)
  await assertJobOwnership(jobId, company.companyId);

  await updateJob(jobId, company.companyId, input);
}

export async function publishJob(userId: string, jobId: string) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  assertCompanyRole(company.companyRole, [...JOB_POSTERS]);

  await assertJobOwnership(jobId, company.companyId);
  await setJobStatus(jobId, company.companyId, 'open');
}

export async function closeJob(userId: string, jobId: string) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  assertCompanyRole(company.companyRole, [...JOB_POSTERS]);

  await assertJobOwnership(jobId, company.companyId);
  await setJobStatus(jobId, company.companyId, 'closed');
}