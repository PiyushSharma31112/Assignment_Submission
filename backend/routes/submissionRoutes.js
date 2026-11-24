import { Router } from 'express';
import {
  createSubmission,
  deleteSubmission,
  downloadSubmissionFile,
  evaluateSubmission,
  listStudents,
  listSubmissions,
} from '../controllers/submissionController.js';
import { requireRole } from '../middleware/auth.js';
import { submissionUpload } from '../services/fileStorage.js';

const router = Router();

router.get('/', listSubmissions);
router.get('/students', requireRole('Teacher'), listStudents);
router.get('/:id/file', downloadSubmissionFile);
router.post('/assignments/:assignmentId', requireRole('Student'), submissionUpload.single('file'), createSubmission);
router.patch('/:id/evaluation', requireRole('Teacher'), evaluateSubmission);
router.delete('/:id', deleteSubmission);

export default router;
