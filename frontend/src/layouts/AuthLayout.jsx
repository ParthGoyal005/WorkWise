import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark large">EKA</span>
          <h1>Enterprise Knowledge Assistant</h1>
          <p>
            Ask questions across company policies with permission-aware AI, and
            evaluate leave eligibility with a transparent rule engine.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          {children}
          <p className="auth-footer-note">
            {title === 'Welcome back' ? (
              <>
                New here? <Link to="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
