import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { assignmentsApi, submissionsApi } from '../services/api.js';
import { Brand, Avatar, Icon } from '../components/SharedUI.jsx';
import LoadingState from '../components/LoadingState.jsx';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import StudentDashboard from '../pages/StudentDashboard.jsx';
import TeacherDashboard from '../pages/TeacherDashboard.jsx';

const pageTitles = {
  dashboard: 'Dashboard', assignments: 'Assignments', submissions: 'Submissions',
  results: 'My Results', students: 'Students', profile: 'Profile',
};

function Sidebar({ role, page, setPage, onLogout }) {
  const studentItems = [['dashboard', 'Dashboard'], ['assignments', 'Assignments'], ['submissions', 'My Submissions'], ['results', 'My Results'], ['profile', 'Profile']];
  const teacherItems = [['dashboard', 'Dashboard'], ['assignments', 'Assignments'], ['submissions', 'Submissions'], ['students', 'Students'], ['profile', 'Profile']];
  return <aside className="sidebar"><Brand light /><div className="side-label">WORKSPACE</div>
    <nav className="side-nav">{(role === 'Teacher' ? teacherItems : studentItems).map(([id, label]) =>
      <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon name={id} />{label}</button>)}
    </nav>
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>We're here to help you learn.</p><a href="mailto:support@assignhub.example">Contact support ↗</a></div>
      <button className="logout-btn" onClick={onLogout}><Icon name="logout" /> Log out</button>
    </div>
  </aside>;
}

function Topbar({ user }) {
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  return <header className="topbar"><div><div className="breadcrumb">Workspace <span>/</span> <strong>{user.role} portal</strong></div><div className="topbar-date">{date}</div></div>
    <div className="topbar-right"><div className="topbar-user"><Avatar name={user.name} /><div><strong>{user.name}</strong><small>{user.role}</small></div></div></div>
  </header>;
}

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const { page: requestedPage } = useParams();
  const navigate = useNavigate();
  const page = pageTitles[requestedPage] ? requestedPage : 'dashboard';
  const [data, setData] = useState({ assignments: [], submissions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoutError, setLogoutError] = useState('');

  const setPage = useCallback((nextPage) => navigate(`/workspace/${nextPage}`), [navigate]);
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [assignmentResult, submissionResult] = await Promise.all([
        assignmentsApi.list(),
        submissionsApi.list(),
      ]);
      setData({
        assignments: assignmentResult.assignments,
        submissions: submissionResult.submissions,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload, page]);
  useEffect(() => {
    const permittedPages = user.role === 'Teacher'
      ? ['dashboard', 'assignments', 'submissions', 'students', 'profile']
      : ['dashboard', 'assignments', 'submissions', 'results', 'profile'];
    if (!permittedPages.includes(requestedPage)) navigate('/workspace/dashboard', { replace: true });
  }, [navigate, requestedPage, user.role]);

  const title = useMemo(() => pageTitles[page], [page]);
  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (requestError) {
      setLogoutError(requestError.message);
    }
  }

  return <div className="app-shell">
    <Sidebar role={user.role} page={page} setPage={setPage} onLogout={handleLogout} />
    <main className="main-area"><Topbar user={user} />
      <div className="page-content"><div className="mobile-page-title">{title}</div>
        <FeedbackMessage error={error || logoutError} />
        {loading ? <LoadingState label="Loading your workspace..." /> : user.role === 'Teacher'
          ? <TeacherDashboard user={user} page={page} setPage={setPage} assignments={data.assignments} submissions={data.submissions} reload={reload} />
          : <StudentDashboard user={user} page={page} setPage={setPage} assignments={data.assignments} submissions={data.submissions} reload={reload} />}
        <footer className="app-footer">© 2026 AssignHub <span>Made for better learning.</span></footer>
      </div>
    </main>
  </div>;
}
