import { useMemo, useState } from 'react';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import { Avatar, EmptyState, Icon, SectionTitle, StatCard, StatusBadge } from '../components/SharedUI.jsx';
import { assignmentsApi, submissionsApi } from '../services/api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function toLocalDateTime(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function AssignmentForm({ assignment, onClose, onSave, busy, error }) {
  const [values, setValues] = useState({
    title: assignment?.title || '',
    subject: assignment?.subject || '',
    description: assignment?.description || '',
    deadline: assignment ? toLocalDateTime(assignment.deadline) : '',
    maxMarks: assignment?.maxMarks || 50,
  });
  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }
  function submit(event) {
    event.preventDefault();
    onSave({ ...values, deadline: new Date(values.deadline).toISOString(), maxMarks: Number(values.maxMarks) });
  }
  return <div className="modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}>
    <div className="modal evaluation-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
      <button className="modal-close" onClick={onClose} aria-label="Close dialog" disabled={busy}>×</button>
      <h2 id="assignment-title">{assignment ? 'Edit assignment' : 'Create assignment'}</h2>
      <p className="modal-sub">Publish assignment details for your students.</p>
      <form onSubmit={submit}>
        <label className="form-label">Assignment title<input value={values.title} onChange={(event) => update('title', event.target.value)} maxLength="120" required /></label>
        <label className="form-label">Subject<input value={values.subject} onChange={(event) => update('subject', event.target.value)} maxLength="100" required /></label>
        <label className="form-label">Instructions<textarea rows="3" value={values.description} onChange={(event) => update('description', event.target.value)} maxLength="2000" required /></label>
        <label className="form-label">Due date<input type="datetime-local" value={values.deadline} onChange={(event) => update('deadline', event.target.value)} required /></label>
        <label className="form-label">Maximum marks<input type="number" min="1" max="1000" step="1" value={values.maxMarks} onChange={(event) => update('maxMarks', event.target.value)} required /></label>
        <FeedbackMessage error={error} />
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : assignment ? 'Save changes' : 'Create assignment'} <span>→</span></button>
        </div>
      </form>
    </div>
  </div>;
}

function EvaluationModal({ submission, onClose, onSave, busy, error }) {
  const [marks, setMarks] = useState(submission.marks ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  return <div className="modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}>
    <div className="modal evaluation-modal" role="dialog" aria-modal="true" aria-labelledby="evaluate-title">
      <button className="modal-close" onClick={onClose} aria-label="Close dialog" disabled={busy}>×</button>
      <div className="evaluation-heading"><div className="file-icon large"><Icon name="file" /></div>
        <div><h2 id="evaluate-title">Evaluate submission</h2><p>{submission.assignment.title}</p></div>
      </div>
      <div className="student-summary"><Avatar name={submission.student.name} /><div><strong>{submission.student.name}</strong>
        <small>{submission.student.email} · Submitted {formatDate(submission.submittedAt)}</small></div>
        <a className="download-link" href={submissionsApi.fileUrl(submission.id)} target="_blank" rel="noreferrer">↓ Download file</a>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); onSave({ marks: Number(marks), feedback }); }}>
        <label className="form-label">Marks <span>(out of {submission.assignment.maxMarks})</span>
          <input type="number" min="0" max={submission.assignment.maxMarks} step="1" required value={marks} onChange={(event) => setMarks(event.target.value)} placeholder="Enter marks" />
        </label>
        <label className="form-label">Feedback<textarea rows="4" maxLength="3000" required value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Share feedback to help the student improve..." /></label>
        <FeedbackMessage error={error} />
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save evaluation'} <span>→</span></button>
        </div>
      </form>
    </div>
  </div>;
}

function Profile({ user }) {
  return <><SectionTitle title="Your profile" subtitle="Manage your account information." />
    <div className="profile-panel"><Avatar name={user.name} /><div><h3>{user.name}</h3><p>{user.email}</p><StatusBadge status="Active" /></div>
      <div className="profile-role"><span>Account type</span><strong>Teacher</strong></div>
    </div>
  </>;
}

export default function TeacherDashboard({ user, page, setPage, assignments, submissions, reload }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const filtered = useMemo(() => submissions.filter((submission) => {
    const searchText = `${submission.student.name} ${submission.assignment.title} ${submission.assignment.subject}`;
    return searchText.toLowerCase().includes(query.toLowerCase());
  }), [query, submissions]);
  const pendingCount = submissions.filter((submission) => submission.status === 'Submitted').length;
  const evaluatedCount = submissions.length - pendingCount;
  const evaluationProgress = submissions.length ? Math.round(evaluatedCount / submissions.length * 100) : 0;
  const students = useMemo(() => {
    const unique = new Map();
    submissions.forEach((submission) => {
      if (!unique.has(submission.student.id)) {
        unique.set(submission.student.id, { ...submission.student, assignment: submission.assignment.title });
      }
    });
    return Array.from(unique.values());
  }, [submissions]);

  async function saveAssignment(values) {
    setBusy(true);
    setError('');
    try {
      if (editing?.id) await assignmentsApi.update(editing.id, values);
      else await assignmentsApi.create(values);
      setEditing(null);
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeAssignment(assignment) {
    if (!window.confirm(`Delete "${assignment.title}" and all its submissions?`)) return;
    setError('');
    try {
      await assignmentsApi.remove(assignment.id);
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveEvaluation(values) {
    setBusy(true);
    setError('');
    try {
      await submissionsApi.evaluate(selectedSubmission.id, values);
      setSelectedSubmission(null);
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (page === 'profile') return <Profile user={user} />;
  if (page === 'students') {
    return <><SectionTitle title="Students" subtitle="Students who have submitted work in your classes." />
      {students.length ? <div className="panel table-panel"><div className="table-toolbar">
        <div><strong>Student directory</strong><span>{students.length} students</span></div>
        <div className="search-box"><Icon name="search" /><input placeholder="Search students..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      </div><div className="table-scroll"><table><thead><tr><th>Student</th><th>Latest assignment</th><th>Submissions</th><th>Status</th></tr></thead>
        <tbody>{students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(query.toLowerCase())).map((student) => <tr key={student.id}>
          <td><div className="student-cell"><Avatar name={student.name} /><div><strong>{student.name}</strong><small>{student.email}</small></div></div></td>
          <td>{student.assignment}</td><td>{submissions.filter((submission) => submission.student.id === student.id).length}</td><td><StatusBadge status="Active" /></td>
        </tr>)}</tbody></table></div></div> : <EmptyState text="Students appear here after they submit their first assignment." />}
    </>;
  }
  if (page === 'assignments') {
    return <><SectionTitle title="Assignments" subtitle="Manage assignment work and review submissions." action="Create assignment" onAction={() => { setError(''); setEditing({}); }} />
      <FeedbackMessage error={error} />
      {assignments.length ? <div className="assignment-grid">{assignments.map((assignment) => <div className="assignment-card" key={assignment.id}>
        <div className="card-top"><div className="file-icon large"><Icon name="file" /></div><StatusBadge status="Active" /></div>
        <h3>{assignment.title}</h3><p className="subject-name">{assignment.subject}</p><p className="assignment-description">{assignment.description}</p>
        <div className="assignment-meta"><span>◷ Due {formatDate(assignment.deadline)}</span><span>▤ {assignment.maxMarks} marks</span></div>
        <div className="assignment-controls"><button className="btn btn-outline full-btn" onClick={() => setPage('submissions')}>View submissions</button>
          <button className="table-action" onClick={() => { setError(''); setEditing(assignment); }}>Edit</button>
          <button className="table-action danger-action" onClick={() => removeAssignment(assignment)}>Delete</button></div>
      </div>)}</div> : <EmptyState text="Create your first assignment to share work with your students." />}
      {editing && <AssignmentForm assignment={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={saveAssignment} busy={busy} error={error} />}
    </>;
  }
  if (page === 'submissions') {
    return <><SectionTitle title="All submissions" subtitle="Review student work and provide helpful feedback." />
      <div className="panel table-panel"><div className="table-toolbar">
        <div><strong>Student submissions</strong><span>{submissions.length} total submissions</span></div>
        <div className="search-box"><Icon name="search" /><input placeholder="Search student or assignment..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      </div>{submissions.length ? <div className="table-scroll"><table><thead><tr><th>Student</th><th>Assignment</th><th>Submitted on</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{filtered.map((submission) => <tr key={submission.id}>
          <td><div className="student-cell"><Avatar name={submission.student.name} /><div><strong>{submission.student.name}</strong><small>{submission.student.email}</small></div></div></td>
          <td><strong>{submission.assignment.title}</strong><small>{submission.assignment.subject}</small></td>
          <td>{formatDate(submission.submittedAt)}</td><td><StatusBadge status={submission.status} /></td>
          <td><button className="btn btn-primary btn-xs" onClick={() => { setSelectedSubmission(submission); setError(''); }}>{submission.status === 'Evaluated' ? 'Edit review' : 'Evaluate'} <span>→</span></button></td>
        </tr>)}</tbody></table></div> : <EmptyState text="Student work will appear here after it is submitted." />}</div>
      <FeedbackMessage error={error} />
      {selectedSubmission && <EvaluationModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} onSave={saveEvaluation} busy={busy} error={error} />}
    </>;
  }

  return <>
    <div className="welcome-row"><div><div className="welcome-eyebrow">TEACHER OVERVIEW</div><h1>Welcome back, {user.name.split(' ')[0]} <span className="wave">✦</span></h1>
      <p>Here's your classroom snapshot. Your guidance makes a difference.</p></div>
      <button className="btn btn-primary" onClick={() => setPage('submissions')}>Review submissions <span>→</span></button>
    </div>
    <div className="stats-grid">
      <StatCard icon="book" label="Active assignments" value={assignments.length} trend="Across your classes" tone="blue" />
      <StatCard icon="submissions" label="Total submissions" value={submissions.length} trend="Student work received" tone="purple" />
      <StatCard icon="clock" label="Pending evaluation" value={pendingCount} trend="Ready for review" tone="orange" />
      <StatCard icon="check" label="Evaluated" value={evaluatedCount} trend="Feedback shared" tone="green" />
    </div>
    <div className="content-grid"><section className="panel recent-panel"><SectionTitle title="Recent submissions" subtitle="Student work that needs your attention." action="View all" onAction={() => setPage('submissions')} />
      {submissions.length ? <div className="table-scroll"><table><thead><tr><th>Student</th><th>Assignment</th><th>Status</th><th /></tr></thead>
        <tbody>{submissions.slice(0, 6).map((submission) => <tr key={submission.id}>
          <td><div className="student-cell"><Avatar name={submission.student.name} /><div><strong>{submission.student.name}</strong><small>{submission.student.email}</small></div></div></td>
          <td><strong>{submission.assignment.title}</strong><small>{formatDate(submission.submittedAt)}</small></td>
          <td><StatusBadge status={submission.status} /></td><td><button className="table-action" onClick={() => { setSelectedSubmission(submission); setError(''); }}>{submission.status === 'Evaluated' ? 'View' : 'Evaluate'} →</button></td>
        </tr>)}</tbody></table></div> : <EmptyState text="Submissions from your students will appear here." />}
    </section>
      <section className="panel review-panel"><SectionTitle title="Evaluation progress" subtitle="Keep feedback moving." />
        <div className="review-summary"><div className="review-number">{evaluationProgress}<span>%</span></div><div><strong>Reviews completed</strong><p>You're helping students move forward.</p></div></div>
        <div className="progress-bar"><span style={{ width: `${evaluationProgress}%` }} /></div>
        <div className="review-footer"><span>Completed <strong>{evaluatedCount}</strong></span><span>Remaining <strong>{pendingCount}</strong></span></div>
        <div className="encouragement teacher-tip"><span>✦</span><div><strong>Feedback makes a difference</strong><p>Specific, kind feedback helps every student improve.</p></div></div>
      </section>
    </div>
    {selectedSubmission && <EvaluationModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} onSave={saveEvaluation} busy={busy} error={error} />}
  </>;
}
