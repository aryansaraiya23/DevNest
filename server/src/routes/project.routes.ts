import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(requireAuth);

// Project CRUD
router.get('/', (req, res) => projectController.list(req, res));
router.post('/', (req, res) => projectController.create(req, res));
router.get('/:id', (req, res) => projectController.getOne(req, res));
router.patch('/:id/rename', (req, res) => projectController.rename(req, res));
router.delete('/:id', (req, res) => projectController.delete(req, res));

// File system endpoints
router.put('/:id/files', (req, res) => projectController.updateFiles(req, res));
router.patch('/:id/language', (req, res) => projectController.updateLanguage(req, res));

export default router;
