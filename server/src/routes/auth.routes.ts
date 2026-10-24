import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth, authRateLimiter } from '../middleware/auth';

const router = Router();

// Public auth endpoints with rate limiting
router.post('/register', authRateLimiter, (req, res) => authController.register(req, res));
router.post('/login', authRateLimiter, (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected session check
router.get('/me', requireAuth, (req, res) => authController.getMe(req, res));

export default router;
