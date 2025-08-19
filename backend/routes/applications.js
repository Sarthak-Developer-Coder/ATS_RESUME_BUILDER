import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listApplications, createApplication, updateApplication, deleteApplication } from '../controllers/applicationController.js';

const router = express.Router();

router.get('/applications', authenticateToken, listApplications);
router.post('/applications', authenticateToken, createApplication);
router.put('/applications/:id', authenticateToken, updateApplication);
router.delete('/applications/:id', authenticateToken, deleteApplication);

export default router;
