import * as repo from './applications.repo';
import { getRecruiterCompany } from '../companies/companies.repo';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { sendInterviewNotification } from '../../shared/mailer';

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


export async function scheduleInterview(
  userId: string,
  applicationId: string,
  body: { scheduledAt: string; meetingLink: string; notes?: string },
) {
  const company = await getRecruiterCompany(userId);
  if (!company) throw new ForbiddenError('No company workspace found.');

  const application = await repo.findApplicationWithApplicant(applicationId, company.companyId);
  if (!application) throw new NotFoundError('Application not found');
  


  // Validate scheduledAt
  const scheduled = new Date(body.scheduledAt);
  if (isNaN(scheduled.getTime())) {
    throw new BadRequestError('scheduledAt is not a valid date');
  }
  if (scheduled <= new Date()) {
    throw new BadRequestError('scheduledAt must be in the future');
  }


  // Advance stage to 'interview' if not already at or past it
  const currentStageIdx = STAGE_ORDER.indexOf(application.stage as Stage);
  const interviewIdx = STAGE_ORDER.indexOf('interview');
  if (currentStageIdx < interviewIdx) {
    await repo.updateApplicationStage(applicationId, 'interview');
  }

  const interview = await repo.createInterview(
    applicationId,
    new Date(body.scheduledAt),
    body.meetingLink,
    body.notes ?? null,
  );

  await sendInterviewNotification(
    application.applicant_email,
    application.job_title,
    new Date(body.scheduledAt),
    body.meetingLink,
    body.notes ?? null,
  );

  return interview;
}