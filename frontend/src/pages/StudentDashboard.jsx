import { useMemo, useState } from 'react';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import { Avatar, EmptyState, Icon, SectionTitle, StatCard, StatusBadge } from '../components/SharedUI.jsx';
import { submissionsApi } from '../services/api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function makeAssignmentRows(assignments, submissions) {
  const byAssignment = new Map(submissions.map((submission) => [submission.assignment.id, submission]));
  return assignments.map((assignment) => {
    const submission = byAssignment.get(assignment.id);
    return {
      ...assignment,
      deadlineLabel: formatDate(assignment.deadline),
      status: submission?.status || 'Pending',
      file: submission?.originalName || '',
      marks: submission?.marks,
      feedback: submission?.feedback || '',
      submission,
    };
  });
}

function UploadModal({ assignment, onClose, onSubmit, busy, error }) {
  const [file, setFile] = useState(null);
  return <div className="modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <button className="modal-close" onClick={onClose} aria-label="Close dialog" disabled={busy}>×</button>
      <div className="modal-symbol"><Icon name="upload" /></div>
      <h2 id="upload-title">{assignment.submission ? 'Submission details' : 'Upload assignment'}</h2>
      <p className="modal-sub">{assignment.title} · {assignment.subject}</p>
      {assignment.submission && <p className="existing-file">
        Submitted file: <a href={submissionsApi.fileUrl(assignment.submission.id)} target="_blank" rel="noreferrer">{assignment.file}</a>
        {assignment.submission.marks !== null && <> · Mark: <strong>{assignment.submission.marks} / {assignment.maxMarks}</strong></>}
      </p>}
      <div className="upload-drop"><input type="file" id="assignment-file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <label htmlFor="assignment-file"><span className="upload-cloud">↑</span><strong>{file?.name || 'Choose a file to upload'}</strong>
          <small>PDF, DOC, DOCX, TXT, JPG or PNG · Max 10 MB</small><span className="choose-file">Browse files</span>
        </label>
      </div>
      {assignment.feedback && <p className="existing-file">Teacher feedback: <strong>{assignment.feedback}</strong></p>}
      <FeedbackMessage error={error} />
      <div className="modal-actions"><button className="btn btn-outline" onClick={onClose} disabled={busy}>Close</button>
        <button className="btn btn-primary" onClick={() => file && onSubmit(file)} disabled={!file || busy}>{busy ? 'Submitting...' : assignment.submission ? 'Replace submission' : 'Submit assignment'} <span>→</span></button>
      </div>
    </div>
  </div>;
}

function AssignmentCard({ assignment, onAction }) {
  return <div className="assignment-card"><div className="card-top"><div className="file-icon large"><Icon name="file" /></div><StatusBadge status={assignment.status} /></div>
    <h3>{assignment.title}</h3><p className="subject-name">{assignment.subject}</p><p className="assignment-description">{assignment.description}</p>
    <div className="assignment-meta"><span>◷ Due {assignment.deadlineLabel}</span><span>▤ {assignment.maxMarks} marks</span></div>
    <button className={`btn ${assignment.submission ? 'btn-outline' : 'btn-primary'} full-btn`} onClick={onAction}>{assignment.submission ? 'View / replace work' : 'Upload work'} <span>→</span></button>
  </div>;
}

function Profile({ user }) {
  return <><SectionTitle title="Your profile" subtitle="Manage your account information." />
    <div className="profile-panel"><Avatar name={user.name} /><div><h3>{user.name}</h3><p>{user.email}</p><StatusBadge status="Active" /></div>
      <div className="profile-role"><span>Account type</span><strong>Student</strong></div>
    </div>
  </>;
}

export default function StudentDashboard({ assignments, submissions, user, page, setPage, reload }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const assignmentRows = useMemo(() => makeAssignmentRows(assignments, submissions), [assignments, submissions]);
  const filtered = assignmentRows.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(query.toLowerCase()));
  const submittedCount = assignmentRows.filter((item) => item.submission).length;
  const evaluated = assignmentRows.filter((item) => item.status === 'Evaluated');
  const average = evaluated.length
    ? `${Math.round(evaluated.reduce((sum, item) => sum + item.marks, 0) / evaluated.reduce((sum, item) => sum + item.maxMarks, 0) * 100)}%`
    : '—';

  async function submitFile(file) {
    setBusy(true);
    setError('');
    try {
      await submissionsApi.submit(selected.id, file);
      setSelected(null);
      await reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (page === 'profile') return <Profile user={user} />;
  if (page === 'results') {
    return <><SectionTitle title="My results" subtitle="Review your marks and teacher feedback." />
      <div className="panel table-panel"><div className="table-toolbar">
        <div><strong>Evaluation history</strong><span>{evaluated.length} evaluated assignments</span></div>
        <div className="search-box"><Icon name="search" /><input placeholder="Search results..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      </div><div className="table-scroll"><table><thead><tr><th>Assignment</th><th>Subject</th><th>Marks</th><th>Teacher feedback</th><th>Status</th></tr></thead>
        <tbody>{filtered.filter((item) => item.status === 'Evaluated').map((item) => <tr key={item.id}>
          <td><strong>{item.title}</strong><small>{item.deadlineLabel}</small></td><td>{item.subject}</td>
          <td><strong>{item.marks} / {item.maxMarks}</strong></td><td>{item.feedback}</td><td><StatusBadge status={item.status} /></td>
        </tr>)}</tbody></table></div></div>
    </>;
  }
  if (page === 'submissions') {
    const submitted = filtered.filter((item) => item.submission);
    return <><SectionTitle title="My submissions" subtitle="Keep track of work you have turned in." />
      <div className="list-toolbar"><div className="search-box"><Icon name="search" /><input placeholder="Search submissions..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      {submitted.length ? <div className="assignment-grid">{submitted.map((item) => <AssignmentCard key={item.id} assignment={item} onAction={() => { setSelected(item); setError(''); }} />)}</div>
        : <EmptyState text="You haven't submitted any assignments yet." />}
      {selected && <UploadModal assignment={selected} onClose={() => setSelected(null)} onSubmit={submitFile} busy={busy} error={error} />}
    </>;
  }
  if (page === 'assignments') {
    return <><SectionTitle title="Assignments" subtitle="Everything assigned to you, all in one place." />
      <div className="list-toolbar"><div className="search-box"><Icon name="search" /><input placeholder="Search assignments..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <button className="filter-btn" onClick={() => setQuery('')}>↕ All assignments</button></div>
      {filtered.length ? <div className="assignment-grid">{filtered.map((item) => <AssignmentCard key={item.id} assignment={item} onAction={() => { setSelected(item); setError(''); }} />)}</div>
        : <EmptyState text="No assignments have been published yet." />}
      {selected && <UploadModal assignment={selected} onClose={() => setSelected(null)} onSubmit={submitFile} busy={busy} error={error} />}
    </>;
  }

  const completion = assignmentRows.length ? Math.round(submittedCount / assignmentRows.length * 100) : 0;
  return <>
    <div className="welcome-row"><div><div className="welcome-eyebrow">STUDENT OVERVIEW</div><h1>Welcome back, {user.name.split(' ')[0]} <span className="wave">✦</span></h1>
      <p>Ready to make progress? Here's what's happening with your assignments.</p></div>
      <button className="btn btn-primary" onClick={() => setPage('assignments')}>Browse assignments <span>→</span></button>
    </div>
    <div className="stats-grid">
      <StatCard icon="book" label="Total assignments" value={assignmentRows.length} trend="Across all subjects" tone="blue" />
      <StatCard icon="check" label="Submitted" value={submittedCount} trend="Keep it up!" tone="green" />
      <StatCard icon="clock" label="Awaiting submission" value={assignmentRows.length - submittedCount} trend="Check your deadlines" tone="orange" />
      <StatCard icon="results" label="Average score" value={average} trend={evaluated.length ? 'Across evaluated work' : 'No results yet'} tone="purple" />
    </div>
    <div className="content-grid"><section className="panel recent-panel"><SectionTitle title="Recent assignments" subtitle="Your latest tasks and their status." action="View all" onAction={() => setPage('assignments')} />
      {assignmentRows.length ? <div className="table-scroll"><table><thead><tr><th>Assignment</th><th>Due date</th><th>Status</th><th /></tr></thead>
        <tbody>{assignmentRows.slice(0, 6).map((item) => <tr key={item.id}>
          <td><div className="assignment-cell"><div className="file-icon"><Icon name="file" /></div><div><strong>{item.title}</strong><small>{item.subject}</small></div></div></td>
          <td>{item.deadlineLabel}</td><td><StatusBadge status={item.status} /></td>
          <td><button className="table-action" onClick={() => { setSelected(item); setError(''); }}>{item.submission ? 'View' : 'Upload'} <span>→</span></button></td>
        </tr>)}</tbody></table></div> : <EmptyState text="Your teachers' assignments will appear here." />}
    </section>
      <section className="panel progress-panel"><SectionTitle title="Your progress" subtitle="A little progress every day." />
        <div className="progress-ring-wrap"><div className="progress-ring" style={{ background: `conic-gradient(#246bfe 0 ${completion}%, #eaf0fa ${completion}% 100%)` }}>
          <div><strong>{completion}%</strong><span>completed</span></div></div></div>
        <div className="progress-legend"><div><span className="legend-dot submitted-dot" />Submitted <strong>{submittedCount}</strong></div>
          <div><span className="legend-dot pending-dot" />Pending <strong>{assignmentRows.length - submittedCount}</strong></div></div>
        <div className="encouragement"><span>✦</span><div><strong>You're doing great!</strong><p>Stay on top of your deadlines to keep your progress going.</p></div></div>
      </section>
    </div>
    {selected && <UploadModal assignment={selected} onClose={() => setSelected(null)} onSubmit={submitFile} busy={busy} error={error} />}
  </>;
}
