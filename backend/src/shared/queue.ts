import { Queue } from 'bullmq';
import { config } from './config';

// All background jobs go into this single queue
export type JobName =
  | 'send-application-confirmation'
  | 'send-interview-notification'
  | 'process-resume'
  | 'cleanup-expired-otps'
  | 'cleanup-expired-refresh-tokens'
  | 'send-recruiter-digest';

// BullMQ Queue uses its own Redis connection (not the shared cache client)
const queue = new Queue('jobs', {
  connection: { url: config.REDIS_URL },
});

export default queue;