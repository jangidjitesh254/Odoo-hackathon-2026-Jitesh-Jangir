import React from 'react';

/**
 * Reusable select dropdown component with custom styling and indicators.
 *
 * @param {Object} props
 * @param {string} props.label - Label text for select
 * @param {string} props.id - Select ID and name
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Selection change handler
 * @param {Array<string|Object>} props.options - Dropdown options (can be string array or objects with {value, label})
 * @param {string} [props.placeholder] - Selection placeholder/disabled initial item
 * @param {boolean} [props.required=false] - Whether dropdown selection is required
 * @param {string} [props.error] - Optional validation error message
 */
export default function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  ...rest
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </label>
      
      <div className="input-container">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          className={`input-field select-field ${error ? 'input-field-error' : ''}`}
          style={error ? { borderColor: 'var(--color-error)' } : {}}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((opt, index) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const labelText = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={index} value={val}>
                {labelText}
              </option>
            );
          })}
        </select>
        
        {/* Custom Chevron Down SVG Arrow */}
        <span className="select-arrow">
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
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: '0.125rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}
