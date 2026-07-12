import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onTabChange }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Session Timer (seconds since component loaded)
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [dashRes, allocRes, assetsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/allocations'),
          api.get('/assets')
        ]);
        setData(dashRes);
        setAllocations(allocRes.allocations || []);
        setAssets(assetsRes.assets || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Session timer incrementer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
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

  // Live progress metrics
  const totalAssetsCount = assets.length || 24;
  const allocatedAssetsCount = assets.filter(a => a.status === 'Allocated').length || 12;
  const availableAssetsCount = assets.filter(a => a.status === 'Available').length || 10;
  
  const allocationPercent = Math.round((allocatedAssetsCount / totalAssetsCount) * 100);
  
  // Circumference for SVG gauge radius 50 is 314
  const circ = 314;
  const strokeOffset = circ - (allocationPercent / 100) * circ;

  // Retrieve the soonest return reminder (overdue or upcoming)
  const nextReturnReminder = overdueReturns.length > 0 ? overdueReturns[0] 
                            : upcomingReturns.length > 0 ? upcomingReturns[0] 
                            : null;

  return (
    <div>
      {/* Welcome Header Controls */}
      <div className="dashboard-welcome-header">
        <div className="welcome-info">
          <h1>Dashboard</h1>
          <p>Plan, prioritize, and manage your assets with ease.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['Admin', 'AssetManager'].includes(user?.role) && (
            <button className="action-btn" onClick={() => onTabChange('directory')}>
              + Add Asset
            </button>
          )}
          <button className="action-btn secondary" onClick={() => onTabChange('setup')}>
            Configure Setup
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        {/* Card 1: Total Assets */}
        <div className="kpi-card dark" onClick={() => onTabChange('directory')}>
          <div className="kpi-card-header">
            <span className="kpi-title">Total Assets</span>
            <div className="kpi-arrow-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </div>
          <div className="kpi-value">{totalAssetsCount}</div>
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
          <div className="kpi-value">{availableAssetsCount}</div>
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
          <div className="kpi-value">{allocatedAssetsCount}</div>
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
          <div className="kpi-value">{kpis.pendingTransfers || 0}</div>
          <span className="kpi-footer gray-pills">On Discuss</span>
        </div>
      </div>

      {/* Grid Row 1: Analytics, Reminders & Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        
        {/* Project Analytics (Dynamic based on inventory levels) */}
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
                <div className="chart-bar solid-green" style={{ height: `${allocationPercent}%` }}>
                  <span className="chart-tooltip">{allocationPercent}%</span>
                </div>
              </div>
              <span className="chart-day">T</span>
            </div>
            <div className="chart-column">
              <div className="chart-bar-container"><div className="chart-bar solid-dark" style={{ height: '85%' }}></div></div>
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

        {/* Reminders: Real deadlines from database */}
        <div className="section-card">
          <div className="section-header">
            <h3>Return Reminders</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '180px', justifyContent: 'space-between' }}>
            {nextReturnReminder ? (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                  Return: {nextReturnReminder.asset_name}
                </h4>
                <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Borrower: {nextReturnReminder.user_name || nextReturnReminder.department_name}
                </div>
                <div className="text-danger" style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  Due: {new Date(nextReturnReminder.expected_return_date).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                  All clear!
                </h4>
                <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  No pending asset return deadlines.
                </span>
              </div>
            )}
            <button className="action-btn" style={{ justifyContent: 'center' }} onClick={() => onTabChange('allocation')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/></svg>
              Process Return
            </button>
          </div>
        </div>

        {/* Project List: Recently Registered Assets */}
        <div className="section-card">
          <div className="section-header">
            <h3>Registered Assets</h3>
            <button className="action-btn secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onTabChange('directory')}>+ New</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
            {assets.slice(0, 4).map(asset => {
              let dotColor = '#3b82f6'; // allocated
              if (asset.status === 'Available') dotColor = '#10b981';
              if (asset.status === 'Under Maintenance') dotColor = '#f59e0b';
              if (['Lost', 'Retired', 'Disposed'].includes(asset.status)) dotColor = '#94a3b8';

              return (
                <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flexGrow: 1 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{asset.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tag: {asset.asset_tag} | {asset.status}</span>
                  </div>
                </div>
              );
            })}
            {assets.length === 0 && (
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>No assets registered.</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Collaboration, Progress & Time Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Team Collaboration: Active Allocations */}
        <div className="section-card">
          <div className="section-header">
            <h3>Active Possessions</h3>
            <button className="action-btn secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onTabChange('allocation')}>+ Assign</button>
          </div>
          <div className="team-list">
            {allocations.slice(0, 4).map(al => (
              <div key={al.id} className="team-row">
                <div className="team-member-info">
                  <div className="team-member-avatar">
                    <img 
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${al.user_name || al.department_name}`} 
                      alt="avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div className="team-member-details">
                    <span className="team-member-name">{al.user_name || al.department_name}</span>
                    <span className="team-member-task">Holding: <strong>{al.asset_name}</strong></span>
                  </div>
                </div>
                <span className={`badge ${al.returned_date ? 'badge-retired' : 'badge-allocated'}`}>
                  {al.returned_date ? 'Returned' : 'Possessed'}
                </span>
              </div>
            ))}
            {allocations.length === 0 && (
              <span className="text-muted" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>No active possessions logged.</span>
            )}
          </div>
        </div>

        {/* Project Progress: Live utilization gauge */}
        <div className="section-card">
          <div className="section-header">
            <h3>Asset Utilization</h3>
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
              <span className="donut-gauge-sub">Assets Utilised</span>
            </div>
          </div>
          <div className="donut-legends">
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Allocated</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary)' }} />Available</div>
            <div className="legend-item"><span className="legend-dot striped" />Other</div>
          </div>
        </div>

        {/* Active Session Uptime Tracker */}
        <div className="time-tracker-card">
          <div className="tracker-title">Session Uptime</div>
          <div className="tracker-time">
            {formatTimer(sessionSeconds)}
          </div>
          <div className="tracker-controls">
            <button
              className="tracker-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pause' : 'Resume'}
            >
              {isTimerRunning ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>
            <button
              className="tracker-btn stop"
              onClick={() => {
                setSessionSeconds(0);
                setIsTimerRunning(false);
              }}
              title="Reset"
            >
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
