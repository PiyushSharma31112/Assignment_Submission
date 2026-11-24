import path from 'node:path';
import { access } from 'node:fs/promises';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import HttpError from '../utils/HttpError.js';
import { serializeSubmission } from '../utils/serializers.js';
import { uploadDirectory, removeStoredFile } from '../services/fileStorage.js';
import { validateObjectId } from '../utils/validation.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listSubmissions = asyncHandler(async (req, res) => {
  let submissions;
  if (req.user.role === 'Student') {
    submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title subject maxMarks')
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
  } else {
    const assignments = await Assignment.find({ createdBy: req.user._id }).select('_id');
    submissions = await Submission.find({ assignment: { $in: assignments.map(({ _id }) => _id) } })
      .populate('assignment', 'title subject maxMarks')
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
  }
  res.json({ submissions: submissions.map(serializeSubmission) });
});

export const createSubmission = asyncHandler(async (req, res) => {
  try {
    validateObjectId(req.params.assignmentId);
  } catch (error) {
    if (req.file) await removeStoredFile(req.file.filename);
    throw error;
  }
  if (!req.file) throw new HttpError(400, 'Choose a file before submitting your assignment.');
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    await removeStoredFile(req.file.filename);
    throw new HttpError(404, 'Assignment not found.');
  }

  let saved = false;
  try {
    const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
    const previousFile = existing?.fileName;
    const submission = existing || new Submission({ assignment: assignment._id, student: req.user._id });
    submission.fileName = req.file.filename;
    submission.originalName = path.basename(req.file.originalname).slice(0, 255);
    submission.mimeType = req.file.mimetype;
    submission.fileSize = req.file.size;
    submission.submittedAt = new Date();
    submission.marks = null;
    submission.feedback = '';
    submission.evaluatedAt = null;
    await submission.save();
    saved = true;
    if (previousFile) await removeStoredFile(previousFile);
    await submission.populate([
      { path: 'assignment', select: 'title subject maxMarks' },
      { path: 'student', select: 'name email' },
    ]);
    res.status(201).json({ submission: serializeSubmission(submission) });
  } catch (error) {
    if (!saved) await removeStoredFile(req.file.filename);
    throw error;
  }
});

export const evaluateSubmission = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const { marks, feedback } = req.body;
  if (!Number.isInteger(marks) || typeof feedback !== 'string' || !feedback.trim() || feedback.trim().length > 3000) {
    throw new HttpError(400, 'Provide a whole-number mark and feedback of up to 3000 characters.');
  }
  const submission = await Submission.findById(req.params.id)
    .populate('assignment', 'title subject maxMarks createdBy')
    .populate('student', 'name email');
  if (!submission || String(submission.assignment.createdBy) !== String(req.user._id)) {
    throw new HttpError(404, 'Submission not found.');
  }
  if (marks < 0 || marks > submission.assignment.maxMarks) {
    throw new HttpError(400, `Marks must be between 0 and ${submission.assignment.maxMarks}.`);
  }
  submission.marks = marks;
  submission.feedback = feedback.trim();
  submission.evaluatedAt = new Date();
  await submission.save();
  res.json({ submission: serializeSubmission(submission) });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);
  const submission = await Submission.findById(req.params.id).populate('assignment', 'createdBy');
  if (!submission) throw new HttpError(404, 'Submission not found.');
  const isOwnerTeacher = req.user.role === 'Teacher' && String(submission.assignment.createdBy) === String(req.user._id);
  const isSubmittingStudent = req.user.role === 'Student' && String(submission.student) === String(req.user._id) && !submission.evaluatedAt;
  if (!isOwnerTeacher && !isSubmittingStudent) throw new HttpError(403, 'You cannot delete this submission.');
  await removeStoredFile(submission.fileName);
  await submission.deleteOne();
  res.status(204).end();
});

export const downloadSubmissionFile = asyncHandler(async (req, res, next) => {
  validateObjectId(req.params.id);
  const submission = await Submission.findById(req.params.id).populate('assignment', 'createdBy');
  if (!submission) throw new HttpError(404, 'Submission not found.');
  const canDownload = req.user.role === 'Student'
    ? String(submission.student) === String(req.user._id)
    : String(submission.assignment.createdBy) === String(req.user._id);
  if (!canDownload) throw new HttpError(403, 'You cannot access this submission file.');
  const filePath = path.join(uploadDirectory, path.basename(submission.fileName));
  try {
    await access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new HttpError(404, 'The submitted file is no longer available.');
    throw error;
  }
  res.download(filePath, submission.originalName, (error) => {
    if (error) next(error);
  });
});

export const listStudents = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ createdBy: req.user._id }).select('_id');
  const submissions = await Submission.find({ assignment: { $in: assignments.map(({ _id }) => _id) } })
    .populate('student', 'name email')
    .populate('assignment', 'title')
    .sort({ submittedAt: -1 });
  const uniqueStudents = new Map();
  for (const submission of submissions) {
    const student = submission.student;
    if (!uniqueStudents.has(String(student._id))) {
      uniqueStudents.set(String(student._id), {
        id: String(student._id),
        name: student.name,
        email: student.email,
        assignment: submission.assignment.title,
        submissions: 1,
      });
    } else {
      uniqueStudents.get(String(student._id)).submissions += 1;
    }
  }
  res.json({ students: Array.from(uniqueStudents.values()) });
});
