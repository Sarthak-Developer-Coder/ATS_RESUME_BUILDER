import express from 'express';
import { 
  uploadResume, 
  saveResume, 
  getResumes, 
  getResume, 
  deleteResume, 
  downloadResume,
  scoreAndSaveResume,
  getUserAverageScore,
  toggleShare,
  getPublicResume
} from '../controllers/resumeController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { importGithub, importLinkedIn } from '../controllers/importController.js';

const router = express.Router();

router.post('/save-resume', authenticateToken, scoreAndSaveResume);
router.get('/average-score', authenticateToken, getUserAverageScore);

router.post('/upload-resume', upload.single('resume'), uploadResume);
// router.post('/save-resume', authenticateToken, saveResume);
router.get('/resumes', authenticateToken, getResumes);
router.get('/resume/:id', authenticateToken, getResume);
router.delete('/resume/:id', authenticateToken, deleteResume);
router.post('/download-resume', downloadResume);
router.post('/resume/:id/share', authenticateToken, toggleShare);
router.get('/r/:slug', getPublicResume);
// Imports
router.post('/import/github', authenticateToken, importGithub);
router.post('/import/linkedin', authenticateToken, importLinkedIn);

export default router;