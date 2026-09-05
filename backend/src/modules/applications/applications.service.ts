import * as repo from './applications.repo';
import { getRecruiterCompany } from '../companies/companies.repo';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../shared/errors';

const STAGE_ORDER = [
  'applied', 'screening', 'interview', 'final_interview', 'offer', 'hired', 'rejected',
] as const;
type Stage = typeof STAGE_ORDER[number];

const TERMINAL_STAGES = new Set<Stage>(['hired', 'rejected']);

function assertValidTransition(current: Stage, target: Stage) {
  if (TERMINAL_STAGES.has(current)) {
    throw new BadRequestError(`Cannot transition from terminal stage '${current}'`);
  }
  if (!STAGE_ORDER.includes(target)) {
    throw new BadRequestError(`'${target}' is not a valid stage`);
  }
  if (target === 'rejected') return;

  const currentIdx = STAGE_ORDER.indexOf(current);
  const targetIdx = STAGE_ORDER.indexOf(target);

  if (targetIdx <= currentIdx) {
    throw new BadRequestError(`Cannot move backward from '${current}' to '${target}'`);
  }
}

export async function moveApplicationStage(
  userId: string,
  applicationId: string,
  targetStage: Stage,
) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  const application = await repo.findApplicationForCompany(applicationId, company.companyId);
  if (!application) throw new NotFoundError('Application not found');

  assertValidTransition(application.stage as Stage, targetStage);

  return repo.updateApplicationStage(applicationId, targetStage);
}