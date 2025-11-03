import { useState } from 'react';
import Parse from 'parse';
import './AuthForm.css';

function Login({ onLoginSuccess, switchToSignup, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Back4app Login Logic ---
    try {
      const user = await Parse.User.logIn(username, password);
      console.log('Logged in user', user);
      onLoginSuccess(); // Tell App.jsx login was successful
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to Finsight</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-button">Login</button>
      </form>
      <p className="switch-auth">
        Don't have an account?{' '}
        <button onClick={switchToSignup} className="link-button">Sign Up</button>
      </p>
    </div>
  );
}

export default Login;