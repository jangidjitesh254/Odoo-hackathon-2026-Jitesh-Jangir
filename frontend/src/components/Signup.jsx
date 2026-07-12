import { useState, useEffect } from 'react';
import InputField from './common/InputField';
import SelectField from './common/SelectField';
import { useAuth } from '../context/AuthContext';

/**
 * Signup Component for AssetFlow.
 * Includes fields for Full Name, Email, Department, Password, and Confirm Password.
 * Displays information stating that only Employee accounts are created directly,
 * and roles are assigned by an Admin later.
 *
 * @param {Object} props
 * @param {function} props.onNavigateToLogin - Callback to navigate to Login page
 */
export default function Signup({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepts() {
      try {
        const response = await fetch('http://localhost:5000/api/departments');
        const data = await response.json();
        if (data && data.departments) {
          const mapped = data.departments.map(d => ({ value: d.id, label: d.name }));
          setDepartments(mapped);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors for that field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    if (!formData.department) newErrors.department = 'Please select a department.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccess('');
    setErrors({});

    try {
      await register(formData.fullName, formData.email, formData.password, formData.department);
      setSuccess('Account created successfully! Please log in.');
      setFormData({
        fullName: '',
        email: '',
        department: '',
        password: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1>Create Account</h1>
        <p>Get started with the AssetFlow Management System</p>
      </div>

      {/* Role Assignment Disclaimer Banner */}
      <div className="role-notice-banner">
        <span className="role-notice-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <p className="role-notice-text">
          Registration sets up an <strong>Employee account</strong> with standard privileges. System administrators will configure role-based permissions (Asset Manager, Admin, Department Head) in the Employee Directory once approved.
        </p>
      </div>

      {errors.general && (
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
          {errors.general}
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
        {/* Full Name */}
        <InputField
          label="Full Name"
          id="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g. Jane Doe"
          required
          error={errors.fullName}
        />

        {/* Email */}
        <InputField
          label="Email Address"
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="e.g. jane.doe@company.com"
          required
          error={errors.email}
        />

        {/* Department Selection */}
        <SelectField
          label="Department"
          id="department"
          value={formData.department}
          onChange={handleChange}
          options={departments}
          placeholder="Select your department"
          required
          error={errors.department}
        />

        {/* Password */}
        <InputField
          label="Password"
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          required
          error={errors.password}
        />

        {/* Confirm Password */}
        <InputField
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat password"
          required
          error={errors.confirmPassword}
        />

        {/* Signup Submit Button */}
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch Footer Link */}
      <div className="auth-switch-footer">
        Already have an account?
        <a
          href="#login"
          className="auth-switch-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToLogin();
          }}
        >
          Sign In
        </a>
      </div>
    </>
  );
}
