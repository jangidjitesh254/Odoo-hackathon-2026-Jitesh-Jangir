import { useState } from 'react';

/**
 * Reusable input field component with custom styling and show/hide password toggle.
 *
 * @param {Object} props
 * @param {string} props.label - Label text for input
 * @param {string} props.id - Input ID and name
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Input onChange handler
 * @param {string} props.placeholder - Input placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {string} [props.error] - Optional validation error message
 */
export default function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </label>
      
      <div className="input-container">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`input-field ${isPassword ? 'input-field-with-icon' : ''} ${
            error ? 'input-field-error' : ''
          }`}
          style={error ? { borderColor: 'var(--color-error)' } : {}}
          {...rest}
        />
        
        {isPassword && (
          <button
            type="button"
            className="input-icon-button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              /* Eye Off Icon */
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
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              /* Eye Icon */
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
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: '0.125rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}
