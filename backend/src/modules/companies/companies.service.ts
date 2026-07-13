import { NotFoundError } from '../../shared/errors';
import {
  getRecruiterCompany,
  getCompanyById,
  type Company,
} from './companies.repo';

/**
 * Returns the company associated with the authenticated recruiter.
 *
 * userId comes from req.user.userId — the verified JWT payload.
 * It is resolved through the recruiters table to obtain company_id.
 * The companies query is then scoped to that company_id.
 *
 * The caller never controls which company is queried.
 */
export async function getMyCompany(userId: string): Promise<Company> {
  const recruiter = await getRecruiterCompany(userId);

  if (!recruiter) {
    throw new NotFoundError('No company associated with this account');
  }

  const company = await getCompanyById(recruiter.companyId);

  if (!company) {
    // The recruiters row references a company_id that no longer exists.
    // This indicates a data integrity problem.
    throw new NotFoundError('Company not found');
  }

  return company;
}