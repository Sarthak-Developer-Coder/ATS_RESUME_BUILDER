import express from 'express';
import { generateSummary, generateSkills, analyzeResume, parseJobDescription, optimizeBullets, generateCoverLetter, detectATSIssues, tailorResume, polishText, translateText, suggestSectionOrder, keywordGapAnalysis, readabilityInsights, weaveKeywords } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-summary', generateSummary);
router.post('/generate-skills', generateSkills);
router.post('/analyze-resume', analyzeResume);
router.post('/parse-jd', parseJobDescription);
router.post('/optimize-bullets', optimizeBullets);
router.post('/generate-cover-letter', generateCoverLetter);
router.post('/detect-ats-issues', detectATSIssues);
router.post('/tailor-resume', tailorResume);
router.post('/polish-text', polishText);
router.post('/translate-text', translateText);
router.post('/suggest-section-order', suggestSectionOrder);
router.post('/keyword-gap', keywordGapAnalysis);
router.post('/readability', readabilityInsights);
router.post('/weave-keywords', weaveKeywords);
// router.post('/score-resume', scoreResume);

export default router;