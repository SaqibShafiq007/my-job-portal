import * as repo from './admin.repo';
import redis from '../../shared/redis';
import { NotFoundError, ConflictError } from '../../shared/errors';

export async function listCompanies(filter?: string) {
  return repo.listCompanies(filter);
}

export async function verifyCompany(id: string) {
  const company = await repo.findCompanyById(id);
  if (!company) throw new NotFoundError('Company not found');
  if (company.verified) throw new ConflictError('Company is already verified');

  return repo.setCompanyVerified(id, true);
}

export async function suspendCompany(id: string) {
  const company = await repo.findCompanyById(id);
  if (!company) throw new NotFoundError('Company not found');
  if (company.suspended) throw new ConflictError('Company is already suspended');

  const updated = await repo.setCompanySuspended(id, true);

  await repo.closeOpenJobsForCompany(id);

  await redis.del('jobs:public:page1');

  return updated;
}