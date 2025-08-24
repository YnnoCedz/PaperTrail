import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import backgroundImage from '../assets/lsu-bg.jpg';
import logoImage from '../assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call your API to trigger a password reset email
    setSubmitted(true);
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="login-card">
        <div className="login-left">
          <img src={logoImage} alt="Logo" className="login-logo" />
          <p className="login-subtitle">Research Portal for Faculty</p>
        </div>

        <div className="login-right">
          <h2 className="login-title">Forgot Password</h2>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="reset-email">Enter your registered email</label>
                <input
                  type="email"
                  id="reset-email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button">
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="auth-message">
              <p>
                If an account exists for <strong>{email}</strong>, you’ll receive a
                password reset link shortly.
              </p>
            </div>
          )}

          <div className="forgot-password">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>

      <div className="login-footer">
        If you are having problems accessing PaperTrail, please visit the ICTS
        Office during office hours.
      </div>
    </div>
  );
};

export default ForgotPassword;
