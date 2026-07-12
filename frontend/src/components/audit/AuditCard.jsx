import React from 'react';

/**
 * AuditCard - Reusable statistics and info card component.
 *
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Numeric or text stat value
 * @param {React.ReactNode} props.icon - Icon SVG/JSX to display in the card
 * @param {string} [props.trendText] - Trend percentage text (e.g. "+5.2%")
 * @param {string} [props.trendDirection] - Direction of the trend: 'up' | 'down' | 'stable'
 */
export default function AuditCard({ title, value, icon, trendText, trendDirection }) {
  const renderTrendIcon = () => {
    if (trendDirection === 'up') {
      return (
        <svg
          className="trend-up"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    } else if (trendDirection === 'down') {
      return (
        <svg
          className="trend-down"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      );
    }
    return null;
  };

  const getTrendClass = () => {
    if (trendDirection === 'up') return 'trend-up';
    if (trendDirection === 'down') return 'trend-down';
    return 'trend-stable';
  };

  return (
    <div className="audit-stat-card">
      <div className="audit-card-info">
        <span className="audit-card-title">{title}</span>
        <span className="audit-card-value">{value}</span>
        
        {trendText && (
          <span className={`audit-card-trend ${getTrendClass()}`}>
            {renderTrendIcon()}
            <span>{trendText}</span>
          </span>
        )}
      </div>
      
      <div className="audit-card-icon">
        {icon}
      </div>
    </div>
  );
}
