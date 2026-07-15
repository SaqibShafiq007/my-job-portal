import { NotFoundError,ConflictError, ForbiddenError  } from '../../shared/errors';
import { sendInvitationEmail } from './companies.email';
import {
  getRecruiterCompany,
  getCompanyById,
  createCompany ,
  type Company,
  findExistingMember,
  findPendingInvitation,
  createInvitation,
} from './companies.repo';
import type { CreateCompanyInput, InviteMemberInput } from './companies.schema';


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



export async function inviteMember(userId: string, input: InviteMemberInput) {
  const company = await getRecruiterCompany(userId); //Does this person even have a company
  if (!company) throw new ForbiddenError('No company workspace found.');

  assertCompanyRole(company.companyRole, ['owner', 'hr_manager']); //Are they allowed to invite people? — only the owner or hr_manager can invite

  const existing = await findExistingMember(company.companyId, input.email);  //Is this email already a member? — stop if yes, can't invite twice.
  if (existing) throw new ConflictError('This person is already a member of your company.');

  const pending = await findPendingInvitation(company.companyId, input.email); //Is there already a pending invite for them?
  if (pending) throw new ConflictError('A pending invitation for this email already exists.');

  const rawToken = await createInvitation(company.companyId, input.email, input.role);

  await sendInvitationEmail(input.email, rawToken);
}

function assertCompanyRole(companyRole: string, allowed: string[]) {
  if (!allowed.includes(companyRole)) {
    throw new ForbiddenError('You do not have permission to perform this action.');
  }
}


