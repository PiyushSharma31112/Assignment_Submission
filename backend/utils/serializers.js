export function serializeUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

export function serializeAssignment(assignment) {
  return {
    id: String(assignment._id),
    title: assignment.title,
    subject: assignment.subject,
    description: assignment.description,
    deadline: assignment.deadline,
    maxMarks: assignment.maxMarks,
    createdBy: assignment.createdBy?._id ? String(assignment.createdBy._id) : String(assignment.createdBy),
    createdAt: assignment.createdAt,
  };
}

export function serializeSubmission(submission) {
  const assignment = submission.assignment;
  const student = submission.student;
  return {
    id: String(submission._id),
    assignment: assignment?._id ? {
      id: String(assignment._id),
      title: assignment.title,
      subject: assignment.subject,
      maxMarks: assignment.maxMarks,
    } : String(assignment),
    student: student?._id ? {
      id: String(student._id),
      name: student.name,
      email: student.email,
    } : String(student),
    originalName: submission.originalName,
    fileSize: submission.fileSize,
    submittedAt: submission.submittedAt,
    status: submission.evaluatedAt ? 'Evaluated' : 'Submitted',
    marks: submission.marks,
    feedback: submission.feedback,
    evaluatedAt: submission.evaluatedAt,
  };
}
