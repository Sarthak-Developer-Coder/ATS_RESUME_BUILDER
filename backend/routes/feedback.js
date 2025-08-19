import express from 'express';
import { 
  submitFeedback, 
  getUserFeedback, 
  getUserFeedbackHistory 
} from '../controllers/feedbackController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/feedback - Submit or update feedback
router.post('/', authenticateToken, submitFeedback);

// GET /api/feedback - Get user's current feedback
router.get('/', authenticateToken, getUserFeedback);

// GET /api/feedback/history - Get user's feedback history
router.get('/history', authenticateToken, getUserFeedbackHistory);

export default router;