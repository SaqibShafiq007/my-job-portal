import { NotFoundError,ConflictError  } from '../../shared/errors';
import {
  getRecruiterCompany,
  getCompanyById,
  createCompany ,
  type Company,
} from './companies.repo';
import type { CreateCompanyInput } from './companies.schema';


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




export async function openWorkspace(userId: string, input: CreateCompanyInput) {
  // Guard: a user can own at most one company
  const existing = await getRecruiterCompany(userId);
  if (existing) {
    throw new ConflictError('You already have a company workspace.');
  }

  return createCompany(userId, input);
}








