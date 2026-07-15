import { Router } from 'express';
import { authMiddleware } from '../../shared/auth-middleware';
import { requireRole } from '../../shared/require-role';
import { getMyCompany, inviteMember } from './companies.service';
import {validateBody    } from '../../shared/validate';
import { createCompanySchema, inviteMemberSchema } from './companies.schema';
import { openWorkspace } from './companies.service';


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


router.post('/', async (req, res, next) => {
  try {
    const input = validateBody(createCompanySchema, req.body);//chk if it is a valid company
    const result = await openWorkspace(req.user!.userId, input); // chk if recruiter already have a company or not
    res.status(201).json({
    companyId: result.companyId,
    name: result.name,
    verified: false,
    });
  } catch (err) {
    next(err);
  }
});


router.post('/invitations', async (req, res, next) => {
  try {
    const input = validateBody(inviteMemberSchema, req.body);
    await inviteMember(req.user!.userId, input);
    res.status(201).json({ message: 'Invitation sent.' });
  } catch (err) {
    next(err);
  }
});

export { router as companiesRouter };