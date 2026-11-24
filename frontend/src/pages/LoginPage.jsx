import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackMessage from '../components/FeedbackMessage.jsx';
import { Icon, Brand } from '../components/SharedUI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage({ serviceError = '' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegistering) await register({ name, email, password, role });
      else await login({ email, password });
      navigate('/workspace/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function chooseMode(registerMode) {
    setIsRegistering(registerMode);
    setError('');
  }

  return <div className="auth-layout">
    <header className="site-header"><Brand />
      <nav><a href="#home">Home</a><a href="#features">Features</a><a href="#about">About</a></nav>
      <div className="header-actions">
        <button className="btn btn-outline btn-small" onClick={() => chooseMode(false)}>Login</button>
        <button className="btn btn-primary btn-small" onClick={() => chooseMode(true)}>Sign Up</button>
      </div>
    </header>
    <main className="hero" id="home">
      <section className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> SIMPLE. SMART. ORGANIZED.</div>
        <h1>Assignment management,<br /><span>made effortless.</span></h1>
        <p className="hero-description">One simple place for students to submit work and teachers to evaluate, guide, and celebrate progress.</p>
        <div className="hero-actions"><button className="btn btn-primary" onClick={() => {
          chooseMode(false);
          document.getElementById('account-form')?.scrollIntoView({ behavior: 'smooth' });
        }}>Get Started <span>→</span></button><a className="learn-link" href="#features">Explore features <span>↗</span></a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>JD</span><span>TS</span><span>RK</span></div>
          <div><strong>Made for better learning</strong><small>Clear feedback. Better outcomes.</small></div>
        </div>
      </section>
      <section className="hero-art" aria-label="Assignment illustration">
        <div className="art-glow" /><div className="floating-pill pill-one">✦ Stay organized</div>
        <div className="floating-pill pill-two"><span className="mini-check">✓</span> Work submitted!</div>
        <div className="art-books"><div className="book book-blue" /><div className="book book-lilac" /><div className="book book-white" /></div>
        <div className="paper-card"><div className="paper-top"><span className="paper-icon">▤</span><span className="paper-dots">•••</span></div>
          <div className="paper-tag">ASSIGNMENT</div><h3>Learning<br />in progress.</h3>
          <div className="paper-line long" /><div className="paper-line" /><div className="paper-line short" />
          <div className="paper-footer"><span>ASSIGNHUB</span><span className="paper-stamp">✓</span></div>
        </div>
        <div className="art-plant"><div className="leaf leaf-a" /><div className="leaf leaf-b" /><div className="leaf leaf-c" /><div className="plant-pot" /></div>
        <div className="art-sparkle sparkle-a">✦</div><div className="art-sparkle sparkle-b">✧</div>
      </section>
    </main>
    <section className="feature-strip" id="features">
      <article className="feature-card"><div className="feature-icon blue"><Icon name="upload" /></div><div><h3>Easy submissions</h3><p>Upload assignments in just a few clicks.</p></div></article>
      <article className="feature-card"><div className="feature-icon green"><Icon name="check" /></div><div><h3>Helpful evaluation</h3><p>Get marks and actionable feedback.</p></div></article>
      <article className="feature-card"><div className="feature-icon purple"><Icon name="results" /></div><div><h3>Track your progress</h3><p>See submissions, results, and deadlines.</p></div></article>
    </section>
    <section className={`auth-card ${isRegistering ? 'register-card' : ''}`} id="account-form">
      <div className="auth-brand"><Brand /></div>
      <h2>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
      <p className="auth-subtitle">{isRegistering ? 'Get started with AssignHub today.' : 'Log in to continue to your workspace.'}</p>
      <form onSubmit={submit}>
        {isRegistering && <label className="input-wrap"><span aria-hidden="true">♙</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" minLength="2" maxLength="80" required /></label>}
        <label className="input-wrap"><span aria-hidden="true">✉</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" maxLength="254" required /></label>
        <label className="input-wrap"><span aria-hidden="true">♙</span><input type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength="8" maxLength="72" required /></label>
        {isRegistering && <label className="select-wrap"><select value={role} onChange={(event) => setRole(event.target.value)}><option value="Student">Student</option><option value="Teacher">Teacher</option></select><span aria-hidden="true">⌄</span></label>}
        <FeedbackMessage error={error || serviceError} />
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait...' : isRegistering ? 'Create account' : 'Login'} <span>→</span></button>
      </form>
      <div className="auth-switch">{isRegistering ? 'Already have an account?' : "Don't have an account?"}
        <button type="button" onClick={() => chooseMode(!isRegistering)}>{isRegistering ? 'Login' : 'Sign up'}</button>
      </div>
      <div className="demo-hint">Create an account to access your workspace</div>
    </section>
    <footer className="landing-footer" id="about">© 2026 AssignHub <span>Built for better learning experiences.</span></footer>
  </div>;
}
