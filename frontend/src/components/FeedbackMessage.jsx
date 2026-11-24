export default function FeedbackMessage({ error, success }) {
  if (!error && !success) return null;
  return <div className={`feedback-message ${error ? 'feedback-error' : 'feedback-success'}`} role="status">
    {error || success}
  </div>;
}
