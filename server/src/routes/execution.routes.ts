import { Router } from 'express';
import { executionController } from '../controllers/execution.controller';
import { requireAuth } from '../middleware/auth';
import { executionRateLimiter } from '../middleware/executionRateLimiter';

const router = Router();

// Execution requires authentication and is rate limited per user
router.use(requireAuth);
router.use(executionRateLimiter);

// POST /api/execute
router.post('/', (req, res) => executionController.execute(req, res));

// POST /api/execute/run-tests
router.post('/run-tests', (req, res) => executionController.runTests(req, res));

export default router;

