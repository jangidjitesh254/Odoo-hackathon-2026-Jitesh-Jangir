import { useState } from 'react';
import InputField from './common/InputField';
import { useAuth } from '../context/AuthContext';

/**
 * Login Component for AssetFlow.
 * Includes email, password (show/hide), remember me, forgot password link,
 * and navigation links.
 *
 * @param {Object} props
 * @param {function} props.onNavigateToSignup - Callback to navigate to Signup page
 */
export default function Login({ onNavigateToSignup }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear errors when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.password);
      setSuccess('Welcome back! Authentication successful.');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1>Welcome Back</h1>
        <p>Please enter your credentials to access your account</p>
      </div>

      {error && (
        <div className="form-alert form-alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="form-alert form-alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Email Field */}
        <InputField
          label="Email Address"
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="e.g. employee@company.com"
          required
        />

        {/* Password Field */}
        <InputField
          label="Password"
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        {/* Actions row: Remember Me & Forgot Password */}
        <div className="form-actions-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="checkbox-input"
            />
            <span className="checkbox-label">Remember me</span>
          </label>

          <a
            href="#forgot-password"
            className="forgot-password-link"
            onClick={(e) => {
              e.preventDefault();
              setError('Password reset link has been requested (Simulated).');
            }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <svg
                style={{
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem',
                }}
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
        
        {/* Style keyframe injecting dynamically for loader spinner */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </form>

      {/* Switch Footer Link */}
      <div className="auth-switch-footer">
        Don't have an account?
        <a
          href="#signup"
          className="auth-switch-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToSignup();
          }}
        >
          Create Account
        </a>
      </div>
    </>
  );
}
