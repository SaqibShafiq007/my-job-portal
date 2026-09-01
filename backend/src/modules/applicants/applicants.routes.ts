import { Router } from 'express';
import { authMiddleware } from '../../shared/auth-middleware';
import { requireRole } from '../../shared/require-role';
import * as service from './applicants.service';

const router = Router();

// Every route on this router requires a valid token with role 'applicant'.
router.use(authMiddleware, requireRole('applicant'));

router.post('/profile', async (req, res, next) => {
  try {
    const { full_name, headline, location, attributes } = req.body;
    const profile = await service.createProfile(req.user!.userId, {
      full_name,
      headline,
      location,
      attributes,
    });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await service.getProfile(req.user!.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const { full_name, headline, location, attributes } = req.body;
    const profile = await service.updateProfile(req.user!.userId, {
      full_name,
      headline,
      location,
      attributes,
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});


router.post('/profile/resume-upload', async (req, res, next) => {
  try {
    const result = await service.getResumeUploadUrl(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/profile/resume', async (req, res, next) => {
  try {
    const { key, filename } = req.body;
    const resume = await service.confirmResumeUpload(req.user!.userId, { key, filename });
    res.status(201).json(resume);
  } catch (err) {
    next(err);
  }
});

export { router as applicantsRouter };