import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import HttpError from '../utils/HttpError.js';
import { parseAssignment, validateObjectId } from '../utils/validation.js';
import { serializeAssignment } from '../utils/serializers.js';
import { removeStoredFile } from '../services/fileStorage.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listAssignments = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'Teacher' ? { createdBy: req.user._id } : {};
  const assignments = await Assignment.find(filter).sort({ deadline: 1, createdAt: -1 });
  res.json({ assignments: assignments.map(serializeAssignment) });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({
    ...parseAssignment(req.body),
    createdBy: req.user._id,
  });
  res.status(201).json({ assignment: serializeAssignment(assignment) });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    parseAssignment(req.body, true),
    { new: true, runValidators: true },
  );
  if (!assignment) throw new HttpError(404, 'Assignment not found.');
  res.json({ assignment: serializeAssignment(assignment) });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!assignment) throw new HttpError(404, 'Assignment not found.');
  const submissions = await Submission.find({ assignment: assignment._id }).select('fileName');
  await Submission.deleteMany({ assignment: assignment._id });
  for (const submission of submissions) await removeStoredFile(submission.fileName);
  res.status(204).end();
});
