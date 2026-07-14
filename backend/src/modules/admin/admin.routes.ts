import { Router } from 'express';
import { authMiddleware } from '../../shared/auth-middleware';
import { requireRole } from '../../shared/require-role';
import { NotFoundError } from '../../shared/errors';
import db  from '../../shared/db';

const router = Router();

// Every route on this router requires a valid token with role 'admin'.
router.use(authMiddleware, requireRole('admin'));

// ADMIN EXCEPTION: Admin routes do not scope by company_id.
// Admins have sanctioned cross-company access. The isolation boundary
// here is enforced by requireRole('admin'), not by a company_id filter.
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const result = await db.query<{
      id: string;
      title: string;
      company_id: string;
      status: string;
    }>(
      `SELECT id, title, company_id, status FROM jobs WHERE id = $1`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Job not found'));
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export { router as adminRouter };