import 'dotenv/config';
import { Worker, Job, Queue } from 'bullmq';
import { config } from '../shared/config';
import { JobName } from '../shared/queue';
import { sendApplicationConfirmationEmail } from '../shared/mailer';
import { processResume } from './handlers/processResume';
import { cleanupExpiredOtps } from './handlers/cleanupExpiredOtps';
import { cleanupExpiredTokens } from './handlers/cleanupExpiredTokens';

const schedulerQueue = new Queue('jobs', {
  connection: { url: config.REDIS_URL },
});

// Registers the recurring cleanup jobs using BullMQ v6's Job Scheduler API.
// upsertJobScheduler is idempotent — calling it again with the same id updates
// the existing schedule instead of creating a duplicate.
async function registerRepeatableJobs() {
  await schedulerQueue.upsertJobScheduler(
    'cleanup-expired-otps-scheduler',
    { pattern: '0 0 * * *' }, // daily at midnight UTC
    { name: 'cleanup-expired-otps', data: {} },
  );

  await schedulerQueue.upsertJobScheduler(
    'cleanup-expired-refresh-tokens-scheduler',
    { pattern: '0 1 * * *' }, // daily at 01:00 UTC
    { name: 'cleanup-expired-refresh-tokens', data: {} },
  );

  const schedulers = await schedulerQueue.getJobSchedulers();
  console.log('[worker] Job schedulers registered:', schedulers.map((s) => s.name));
}

const worker = new Worker(
  'jobs',
  async (job: Job) => {
    console.log(`[worker] Processing job ${job.name} (id: ${job.id})`);

    switch (job.name as JobName) {
      case 'send-application-confirmation': {
        const { applicantEmail, jobTitle, companyName } = job.data;
        await sendApplicationConfirmationEmail(applicantEmail, jobTitle, companyName);
        break;
      }
      case 'process-resume': {
        const { resumeId, s3Key } = job.data;
        await processResume(resumeId, s3Key);
        break;
      }
      case 'cleanup-expired-otps': {
        await cleanupExpiredOtps();
        break;
      }
      case 'cleanup-expired-refresh-tokens': {
        await cleanupExpiredTokens();
        break;
      }
      default:
        console.warn(`[worker] Unknown job name: ${job.name}. Skipping.`);
    }
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: 5,
  },
);

registerRepeatableJobs().catch(console.error);