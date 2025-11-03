import { useState } from 'react';
import Parse from 'parse';
import './AuthForm.css';

function Signup({ onSignupSuccess, switchToLogin, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Back4app Signup Logic ---
    try {
      const user = new Parse.User();
      user.setUsername(username);
      user.setPassword(password);
      // user.setEmail(email); // Optional: Add email field if needed

      await user.signUp();
      console.log('User signed up successfully:', user);
      onSignupSuccess(); // Tell App.jsx signup was successful
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Username might already exist.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up for Finsight</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Optional: Add Email input field here */}
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-button">Sign Up</button>
      </form>
      <p className="switch-auth">
        Already have an account?{' '}
        <button onClick={switchToLogin} className="link-button">Log In</button>
      </p>
    </div>
  );
}

export default Signup;