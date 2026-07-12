import React from 'react';

/**
 * Main Layout for Authentication. Provides a split screen layout on desktop:
 * - Left side: Enterprise visual showcase with branding and system status widget.
 * - Right side: Dynamic form container.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Login or Signup form components
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-body-wrapper">
      <div className="auth-container">
        
        {/* Left Column: Desktop Enterprise Showcase */}
        <div className="auth-sidebar">
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              {/* AssetFlow Icon (Layered resource flow logo) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="24"
                height="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="sidebar-brand-name">AssetFlow</span>
          </div>

          {/* Core Content */}
          <div className="sidebar-content">
            <div className="sidebar-tagline">
              <h2>Smart Resource Orchestration</h2>
              <p>
                Optimize asset utilization, automate maintenance tracking, and empower operations across your enterprise from a unified control center.
              </p>
            </div>

            {/* ERP Dashboard Preview Widget */}
            <div className="dashboard-preview">
              <div className="preview-title">
                <span>System Analytics</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: '500' }}>
                  <span className="pulse-indicator"></span>
                  Active
                </span>
              </div>
              
              <div className="preview-grid">
                <div className="preview-card">
                  <div className="preview-card-label">Total Assets</div>
                  <div className="preview-card-value">1,482</div>
                  <div className="preview-card-footer" style={{ color: 'var(--color-success)' }}>
                    ↑ 12% this quarter
                  </div>
                </div>

                <div className="preview-card">
                  <div className="preview-card-label">Active Deployments</div>
                  <div className="preview-card-value">94.2%</div>
                  <div className="preview-card-footer">
                    942 operations live
                  </div>
                </div>

                <div className="preview-card" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="preview-card-label">Resource Allocation Rate</div>
                    <div className="preview-card-value" style={{ fontSize: '1.1rem' }}>88%</div>
                  </div>
                  <div className="utilization-bar-container">
                    <div className="utilization-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            <span>© {new Date().getFullYear()} AssetFlow Technologies Inc. All rights reserved.</span>
          </div>
        </div>

        {/* Right Column: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-card">
            
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="mobile-logo-header">
              <div className="mobile-logo">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  width="26"
                  height="26"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span className="mobile-brand-name">AssetFlow</span>
            </div>

            {/* Injected Login or Signup Page Form Content */}
            {children}
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
