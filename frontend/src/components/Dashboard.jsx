import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onTabChange }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Time Tracker stopwatch states
  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 start value
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/dashboard');
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Time Tracker interval timer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  if (loading) {
    return <div className="text-muted">Loading dashboard analytics...</div>;
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  const kpis = data?.kpis || {};
  const overdueReturns = data?.overdueReturns || [];
  const upcomingReturns = data?.upcomingReturns || [];
  const notifications = data?.recentNotifications || [];

  // Half-donut progress gauge calculations
  const totalAssets = (kpis.assetsAvailable || 0) + (kpis.assetsAllocated || 0);
  const allocationPercent = totalAssets ? Math.round((kpis.assetsAllocated / totalAssets) * 100) : 41; // fallback to mockup's 41% if empty
  
  // Circumference of path radius 50 is 2*PI*50 = 314
  // Stroke offset formula: circ - (percent/100)*circ.
  const circ = 314;
  const strokeOffset = circ - (allocationPercent / 100) * circ;

  return (
    <div>
      {/* Donezo Dashboard Welcome Header Row */}
      <div className="dashboard-welcome-header">
        <div className="welcome-info">
          <h1>Dashboard</h1>
          <p>Plan, prioritize, and manage your assets with ease.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="action-btn" onClick={() => onTabChange('directory')}>
            + Add Asset
          </button>
          <button className="action-btn secondary" onClick={() => onTabChange('setup')}>
            Import Data
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        {/* Card 1: Total Assets - Dark Forest Green theme */}
        <div className="kpi-card dark" onClick={() => onTabChange('directory')}>
          <div className="kpi-card-header">
            <span className="kpi-title">Total Assets</span>
            <div className="kpi-arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div className="kpi-value">{totalAssets || 24}</div>
          <span className="kpi-footer increased-green">5 Increased from last month</span>
        </div>

        {/* Card 2: Available Assets */}
        <div className="kpi-card" onClick={() => onTabChange('directory')}>
          <div className="kpi-card-header">
            <span className="kpi-title">Available Assets</span>
            <div className="kpi-arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.assetsAvailable || 10}</div>
          <span className="kpi-footer increased-green" style={{ background: '#f0fdf4', color: '#15803d' }}>6 Increased from last month</span>
        </div>

        {/* Card 3: Allocated Assets */}
        <div className="kpi-card" onClick={() => onTabChange('allocation')}>
          <div className="kpi-card-header">
            <span className="kpi-title">Allocated Assets</span>
            <div className="kpi-arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.assetsAllocated || 12}</div>
          <span className="kpi-footer increased-green" style={{ background: '#f0fdf4', color: '#15803d' }}>2 Increased from last month</span>
        </div>

        {/* Card 4: Pending Transfers */}
        <div className="kpi-card" onClick={() => onTabChange('allocation')}>
          <div className="kpi-card-header">
            <span className="kpi-title">Pending Transfers</span>
            <div className="kpi-arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div className="kpi-value">{kpis.pendingTransfers || 2}</div>
          <span className="kpi-footer gray-pills">On Discuss</span>
        </div>
      </div>

      {/* Grid Row 1: Analytics, Reminders & Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        
        {/* Project Analytics Striped Bar Chart */}
        <div className="section-card">
          <div className="section-header">
            <h3>Project Analytics</h3>
          </div>
          <div className="project-analytics-chart">
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar striped" style={{ height: '40%' }}></div></div>
              <span className="chart-day">S</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar solid-green" style={{ height: '70%' }}></div></div>
              <span className="chart-day">M</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container">
                <div className="chart-bar solid-green" style={{ height: '55%' }}>
                  <span className="chart-tooltip">74%</span>
                </div>
              </div>
              <span className="chart-day">T</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar solid-dark" style={{ height: '90%' }}></div></div>
              <span className="chart-day">W</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar striped" style={{ height: '45%' }}></div></div>
              <span className="chart-day">T</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar striped" style={{ height: '35%' }}></div></div>
              <span className="chart-day">F</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar striped" style={{ height: '50%' }}></div></div>
              <span className="chart-day">S</span>
            </div>
          </div>
        </div>

        {/* Reminders / Deadlines Card */}
        <div className="section-card">
          <div className="section-header">
            <h3>Reminders</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '180px', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                Meeting with Arc Company
              </h4>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Time: 02:00 pm - 04:00 pm
              </span>
            </div>
            <button className="action-btn" style={{ justifyContent: 'center' }} onClick={() => alert('Launching Meeting portal...')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Start Meeting
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="section-card">
          <div className="section-header">
            <h3>Project</h3>
            <button className="action-btn secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onTabChange('directory')}>+ New</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
            {[
              { name: 'Develop API Endpoints', date: 'Nov 26, 2024', color: '#3b82f6' },
              { name: 'Onboarding Flow', date: 'Nov 28, 2024', color: '#10b981' },
              { name: 'Build Dashboard', date: 'Nov 30, 2024', color: '#f59e0b' },
              { name: 'Optimize Page Load', date: 'Dec 5, 2024', color: '#e11d48' }
            ].map(proj => (
              <div key={proj.name} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flexGrow: 1 }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{proj.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due date: {proj.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Collaboration, Progress & Time Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Team Collaboration List */}
        <div className="section-card">
          <div className="section-header">
            <h3>Team Collaboration</h3>
            <button className="action-btn secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onTabChange('setup')}>+ Add Member</button>
          </div>
          <div className="team-list">
            {[
              { name: 'Alexandra Deff', task: 'Github Project Repository', status: 'Completed', badgeClass: 'badge-available', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alexandra' },
              { name: 'Edwin Adenike', task: 'User Authentication System', status: 'In Progress', badgeClass: 'badge-reserved', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=edwin' },
              { name: 'Isaac Oluwatemilorun', task: 'Search and Filter Functionality', status: 'Pending', badgeClass: 'badge-lost', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=isaac' },
              { name: 'David Oshodi', task: 'Responsive Layout for Homepage', status: 'In Progress', badgeClass: 'badge-reserved', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=david' }
            ].map(member => (
              <div key={member.name} className="team-row">
                <div className="team-member-info">
                  <div className="team-member-avatar">
                    <img src={member.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="team-member-details">
                    <span className="team-member-name">{member.name}</span>
                    <span className="team-member-task">Working on <strong>{member.task}</strong></span>
                  </div>
                </div>
                <span className={`badge ${member.badgeClass}`}>{member.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress Gauge */}
        <div className="section-card">
          <div className="section-header">
            <h3>Project Progress</h3>
          </div>
          <div className="donut-gauge-container">
            <svg className="donut-gauge-svg">
              <circle className="donut-gauge-track" cx="110" cy="110" r="50" />
              <path
                className="donut-gauge-indicator"
                d="M 60,110 A 50,50 0 0,1 160,110"
                strokeDasharray="314"
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="donut-gauge-center">
              <span className="donut-gauge-value">{allocationPercent}%</span>
              <span className="donut-gauge-sub">Project Ended</span>
            </div>
          </div>
          <div className="donut-legends">
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Completed</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary)' }} />In Progress</div>
            <div className="legend-item"><span className="legend-dot striped" />Pending</div>
          </div>
        </div>

        {/* Time Tracker Card */}
        <div className="time-tracker-card">
          <div className="tracker-title">Time Tracker</div>
          <div className="tracker-time">
            {formatTimer(timerSeconds)}
          </div>
          <div className="tracker-controls">
            <button
              className="tracker-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pause' : 'Resume'}
            >
              {isTimerRunning ? (
                /* Pause SVG Icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="4"/></svg>
              ) : (
                /* Play/Resume SVG Icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>
            <button
              className="tracker-btn stop"
              onClick={() => {
                setTimerSeconds(0);
                setIsTimerRunning(false);
              }}
              title="Reset"
            >
              /* Stop SVG Icon */
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            </button>
          </div>
        </div>

      </div>

      {/* Critical Overdue Returns Banner Alert */}
      {overdueReturns.length > 0 && (
        <div className="section-card" style={{ borderLeft: '4px solid var(--danger)', background: 'var(--danger-bg)', marginTop: '2rem' }}>
          <div className="section-header">
            <h3 className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Critical Overdue Returns Alert
            </h3>
            <span className="badge badge-lost">{overdueReturns.length} Assets Overdue</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>Held By</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueReturns.map(item => (
                  <tr key={item.id}>
                    <td className="text-danger font-semibold">{item.asset_tag}</td>
                    <td>{item.asset_name}</td>
                    <td>{item.user_name || item.department_name || 'N/A'}</td>
                    <td>{new Date(item.expected_return_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-lost">Overdue</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
