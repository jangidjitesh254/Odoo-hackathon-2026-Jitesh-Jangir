import { useState } from 'react';
import AuthLayout from './components/AuthLayout';
import Login from './components/Login';
import Signup from './components/Signup';
import AuditPage from './components/audit/AuditPage';
import './Auth.css';
import './App.css';

export default function App() {
  // Modes: 'auth' (Login/Signup) or 'dashboard' (Audit Dashboard)
  const [appMode, setAppMode] = useState('dashboard');
  
  // Auth states
  const [authView, setAuthView] = useState('login');
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLoginSubmit = () => {
    // On simulated login, transition to dashboard
    setAppMode('dashboard');
  };

  const handleLogout = () => {
    // Transition back to auth login
    setAppMode('auth');
    setAuthView('login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      
      {/* Demo View Switching Header Bar */}
      <div className="demo-preview-bar">
        <span>AssetFlow Demo Mode: <strong>{appMode === 'dashboard' ? 'Audit Management Dashboard' : 'Authentication Screen'}</strong></span>
        <button 
          className="demo-trigger-btn"
          onClick={() => setAppMode(prev => prev === 'dashboard' ? 'auth' : 'dashboard')}
        >
          {appMode === 'dashboard' ? 'Switch to Login/Signup View' : 'Switch to Dashboard View'}
        </button>
      </div>

      {appMode === 'auth' ? (
        /* ================= AUTHENTICATION FLOW ================= */
        <AuthLayout>
          {authView === 'login' ? (
            <Login 
              onNavigateToSignup={() => setAuthView('signup')} 
              // Connect login submit to switch to dashboard
              onSubmitSuccess={handleLoginSubmit} 
            />
          ) : (
            <Signup onNavigateToLogin={() => setAuthView('login')} />
          )}
        </AuthLayout>
      ) : (
        /* ================= DASHBOARD LAYOUT & AUDIT PAGE ================= */
        <div className="dashboard-layout">
          
          {/* Sidebar Backdrop for Mobile */}
          {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}

          {/* Sidebar Navigation */}
          <aside className={`dashboard-sidebar ${sidebarOpen ? 'dashboard-sidebar-open' : ''}`}>
            <div>
              {/* Brand Header */}
              <div className="sidebar-brand">
                <span className="brand-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    width="22"
                    height="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </span>
                <span className="brand-text">AssetFlow</span>
              </div>

              {/* Sidebar Menu Items */}
              <nav className="sidebar-nav">
                <button className="nav-item" onClick={() => alert('Dashboard overview is a demo mockup. Please click "Audits" to inspect the Audit page.')}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
                  </span>
                  Dashboard
                </button>

                <button className="nav-item" onClick={() => alert('Assets Directory is a demo mockup. Please click "Audits" to inspect the Audit page.')}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </span>
                  Assets
                </button>

                <button className="nav-item" onClick={() => alert('Resource Matrix is a demo mockup. Please click "Audits" to inspect the Audit page.')}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span>
                  Resources
                </button>

                {/* ACTIVE TAB: Audits */}
                <button className="nav-item nav-item-active" onClick={closeSidebar}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </span>
                  Audits
                </button>

                <button className="nav-item" onClick={() => alert('Employee Directory is a demo mockup. Please click "Audits" to inspect the Audit page.')}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  </span>
                  Employees
                </button>

                <button className="nav-item" onClick={() => alert('System Settings is a demo mockup. Please click "Audits" to inspect the Audit page.')}>
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>
                  </span>
                  Settings
                </button>
              </nav>
            </div>

            {/* Sidebar User Footer */}
            <div className="sidebar-user-footer">
              <div className="user-avatar-block">
                <div className="user-avatar">AJ</div>
                <div className="user-details">
                  <span className="user-name">Alex Johnson</span>
                  <span className="user-role">System Auditor</span>
                </div>
              </div>
              <button 
                className="logout-icon-btn" 
                onClick={handleLogout}
                aria-label="Log out of application"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <div className="dashboard-main-area">
            
            {/* Top Navigation Bar */}
            <header className="dashboard-navbar">
              <div className="navbar-left">
                {/* Mobile Menu Hamburg Toggle Button */}
                <button className="navbar-toggle-btn" onClick={toggleSidebar} aria-label="Open navigation sidebar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                
                {/* Search Bar mockup */}
                <div className="navbar-search-mock">
                  <span className="navbar-search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input type="text" className="navbar-search-input" placeholder="Quick search..." readOnly onClick={() => alert('Quick search bar is a layout mockup. Use the page search below for full filtering.')} />
                </div>
              </div>

              <div className="navbar-right">
                {/* Live Connection indicator */}
                <div className="nav-system-status-indicator">
                  <span className="status-dot-pulse"></span>
                  System Online
                </div>

                {/* Notifications Bell Mockup */}
                <button className="navbar-badge-btn" onClick={() => alert('Notifications: 1 New overdue audit notice.')} aria-label="Notifications panel">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  <span className="navbar-badge-dot"></span>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="dashboard-content-viewport">
              <AuditPage />
            </main>

          </div>
          
        </div>
      )}
    </div>
  );
}
