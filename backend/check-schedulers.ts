import 'dotenv/config';
import { Queue } from 'bullmq';
import { config } from './src/shared/config';

(async () => {
  const q = new Queue('jobs', { connection: { url: config.REDIS_URL } });
  const schedulers = await q.getJobSchedulers();
  console.log('Count:', schedulers.length);
  schedulers.forEach(s => console.log(s.name, s.pattern));
  await q.close();
})();
