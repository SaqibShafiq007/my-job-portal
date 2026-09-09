import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { config } from '../shared/config';
import { JobName } from '../shared/queue';

// Worker connection must be separate from the Queue connection
const worker = new Worker(
  'jobs',
  async (job: Job) => {
    console.log(`[worker] Processing job ${job.name} (id: ${job.id})`);

    switch (job.name as JobName) {
      // Handlers will be added in future chapters
      default:
        console.warn(`[worker] Unknown job name: ${job.name}. Skipping.`);
    }
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  console.log(`[worker] Job completed: ${job.name} (id: ${job.id})`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] Job failed: ${job?.name} (id: ${job?.id})`, err.message);
});

console.log('[worker] Worker started and listening for jobs...');