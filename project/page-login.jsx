/* KavPMS — Login page */
/* eslint-disable */
const { useState: useLoginState } = React;

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useLoginState('');
  const [password, setPassword] = useLoginState('');
  const [error, setError]       = useLoginState('');
  const [loading, setLoading]   = useLoginState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('kavpms.token', data.token);
      localStorage.setItem('kavpms.user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="aurora"><span /></div>
      <div className="aurora-grain" />
      <div className="login-box glass-strong">
        <div className="login-header">
          <div className="sb-logo" style={{ width: 56, height: 56, fontSize: 28, margin: '0 auto 16px', borderRadius: 16 }}>F</div>
          <h1 className="text-h fz-24 fw-5" style={{ letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome to Fifi Resorts</h1>
          <p className="text-2 fz-13">Villa Property Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <Ic.AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-3 fz-11">
            Demo credentials: <span className="mono">admin / password</span>
          </p>
        </div>
      </div>
    </div>
  );
}

window.Login = Login;
