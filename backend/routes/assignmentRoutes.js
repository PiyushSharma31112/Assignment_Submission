import { Router } from 'express';
import { createAssignment, deleteAssignment, listAssignments, updateAssignment } from '../controllers/assignmentController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', listAssignments);
router.post('/', requireRole('Teacher'), createAssignment);
router.patch('/:id', requireRole('Teacher'), updateAssignment);
router.delete('/:id', requireRole('Teacher'), deleteAssignment);

export default router;
