// backend/src/modules/applicants/applicants.service.ts
import * as repo from './applicants.repo';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { v4 as uuidv4 } from 'uuid';
import { getPresignedUploadUrl } from '../../shared/storage';
import {config} from '../../shared/config';


export async function createProfile(
  userId: string,
  body: {
    full_name: string;
    headline?: string;
    location?: string;
    attributes?: Record<string, unknown>;
  },
) {
  const existing = await repo.findApplicantByUserId(userId);
  if (existing) throw new ConflictError('Profile already exists');
  return repo.createApplicantProfile(
    userId,
    body.full_name,
    body.headline,
    body.location,
    body.attributes ?? {},
  );
}

export async function getProfile(userId: string) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');
  return profile;
}

export async function updateProfile(
  userId: string,
  fields: {
    full_name?: string;
    headline?: string;
    location?: string;
    attributes?: Record<string, unknown>;
  },
) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');
  return repo.updateApplicantProfile(profile.id, fields);
}


export async function getResumeUploadUrl(userId: string) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found — create your profile first');

  const key = `resumes/${profile.id}/${uuidv4()}.pdf`;
  const uploadUrl = await getPresignedUploadUrl(key, 'application/pdf');
  return { uploadUrl, key };
}

export async function confirmResumeUpload(
  userId: string,
  body: { key: string; filename: string }
) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');

  // Verify the key belongs to this applicant
  if (!body.key.startsWith(`resumes/${profile.id}/`)) {
    throw new ForbiddenError('Key does not belong to this applicant');
  }

  return repo.createResume(profile.id, body.filename, body.key);
}

export async function addJobToShortlist(userId: string, jobId: string) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');

  try {
    return await repo.addToShortlist(profile.id, jobId);
  } catch (err: any) {
    if (err.code === '23505') throw new ConflictError('Job already in shortlist');
    throw err;
  }
}

export async function getShortlist(userId: string) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');
  return repo.listShortlist(profile.id);
}

export async function removeJobFromShortlist(userId: string, jobId: string) {
  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');
  await repo.removeFromShortlist(profile.id, jobId);
}

export async function applyToJobs(
  userId: string,
  body: { jobIds: string[]; answers: Record<string, unknown[]> },
) {
  if (body.jobIds.length === 0 || body.jobIds.length > 10) {
    throw new BadRequestError('jobIds must contain 1–10 items');
  }

  const profile = await repo.findApplicantByUserId(userId);
  if (!profile) throw new NotFoundError('Profile not found');

  const openJobs = await repo.getOpenJobs(body.jobIds);
  const openJobIds = new Set(openJobs.map((j) => j.id));
  const closedOrMissing = body.jobIds.filter((id) => !openJobIds.has(id));
  if (closedOrMissing.length > 0) {
    throw new NotFoundError(`Jobs not found or not open: ${closedOrMissing.join(', ')}`);
  }

  const alreadyApplied = await repo.checkExistingApplications(profile.id, body.jobIds);
  const alreadyAppliedSet = new Set(alreadyApplied);

  const created: string[] = [];
  const skipped: string[] = [];

  for (const jobId of body.jobIds) {
    if (alreadyAppliedSet.has(jobId)) {
      skipped.push(jobId);
      continue;
    }

    const answers = body.answers[jobId] ?? [];
    const snapshot = {}; // snapshot content added in ch51

    const application = await repo.insertApplication(profile.id, jobId, answers, snapshot);
    if (application) {
      created.push(application.id);
    } else {
      skipped.push(jobId);
    }
  }

  return { created, skipped };
}