import { Router } from 'express';
import { authMiddleware } from '../../shared/auth-middleware';
import { requireRole } from '../../shared/require-role';
import { getMyCompany } from './companies.service';

const router = Router();

// Every route on this router requires a valid token with role 'recruiter'.
router.use(authMiddleware, requireRole('recruiter'));

/**
 * GET /api/companies/me
 *
 * Returns the authenticated recruiter's company.
 * The company is determined by the recruiter's user_id (from the JWT),
 * resolved through the recruiters table. The caller cannot specify
 * a different company — the scope is fixed by the database row.
 */
router.get('/me', async (req, res, next) => {
  try {
    const company = await getMyCompany(req.user!.userId);
    res.json(company);
  } catch (err) {
    next(err);
  }
});

export { router as companiesRouter };