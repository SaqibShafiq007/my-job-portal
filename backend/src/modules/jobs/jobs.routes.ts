import { Router } from 'express';
import { authMiddleware } from '../../shared/auth-middleware';
import { requireRole } from '../../shared/require-role';
import { getRecruiterCompany } from '../companies/companies.repo';
import { assertJobOwnership } from './jobs.repo';
import { NotFoundError } from '../../shared/errors';

const router = Router();

router.use(authMiddleware, requireRole('recruiter'));

/**
 * GET /api/jobs/:id
 *
 * Returns a job posting owned by the authenticated recruiter's company.
 * Steps:
 *  1. Resolve companyId from the verified JWT (via recruiters table).
 *  2. Assert the job belongs to that company.
 *  3. Return the job data.
 *
 * A recruiter from a different company receives 404 — not 403.
 * The response does not confirm the job exists at all.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const recruiter = await getRecruiterCompany(req.user!.userId);

    if (!recruiter) {
      return next(new NotFoundError('No company associated with this account'));
    }

    await assertJobOwnership(req.params.id, recruiter.companyId);

    // assertJobOwnership throws if ownership fails.
    // Reaching this point means the job exists and belongs to this company.
    // A full implementation would fetch complete job details here.
    res.json({ jobId: req.params.id, companyId: recruiter.companyId });
  } catch (err) {
    next(err);
  }
});

export { router as jobsRouter };