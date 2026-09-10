import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { config } from '../shared/config';
import { JobName } from '../shared/queue';
import { sendApplicationConfirmationEmail } from '../shared/mailer';

// Worker connection must be separate from the Queue connection
const worker = new Worker(
  'jobs',
  async (job: Job) => {
    console.log(`[worker] Processing job ${job.name} (id: ${job.id})`);

    switch (job.name as JobName) {
      // Sends a confirmation email to the applicant after a successful application
      case 'send-application-confirmation': {
        const { applicantEmail, jobTitle, companyName } = job.data;
        await sendApplicationConfirmationEmail(applicantEmail, jobTitle, companyName);
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