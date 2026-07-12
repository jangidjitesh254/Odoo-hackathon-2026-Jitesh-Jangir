import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ActivityLogs() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const isElevated = ['Admin', 'AssetManager'].includes(user?.role);
      
      const [notifRes, auditRes] = await Promise.all([
        api.get('/logs/notifications'),
        isElevated ? api.get('/logs/audit') : Promise.resolve({ logs: [] })
      ]);

      setNotifications(notifRes.notifications || []);
      setAuditLogs(auditRes.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/logs/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const isElevated = ['Admin', 'AssetManager'].includes(user?.role);

  return (
    <div>
      {/* Sub tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeSubTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('notifications')}
        >
          My Notifications
        </button>
        {isElevated && (
          <button
            className={`tab-btn ${activeSubTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('audit')}
          >
            System Activity Log
          </button>
        )}
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <div className="text-muted">Loading logs feed...</div>
      ) : (
        <>
          {/* Tab 1: Notifications */}
          {activeSubTab === 'notifications' && (
            <div className="section-card">
              <div className="section-header">
                <h3>Inbox Notifications</h3>
                <span className="badge badge-allocated">
                  {notifications.filter(n => !n.is_read).length} Unread
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.length === 0 ? (
                  <div className="text-muted text-center" style={{ padding: '2rem 0' }}>No notifications received.</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`kpi-card`} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: '1rem',
                        borderLeft: !notif.is_read ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <div>
                        <div className="font-semibold" style={{ fontSize: '0.95rem', color: !notif.is_read ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{notif.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button 
                          className="logout-btn" 
                          style={{ borderColor: 'var(--primary)', color: 'var(--primary)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: System Audit Log (Admin / Manager only) */}
          {activeSubTab === 'audit' && isElevated && (
            <div className="section-card">
              <div className="section-header">
                <h3>System Action Audits</h3>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th>Executed Action</th>
                      <th>Action Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan="6" className="text-muted text-center">No audit logs recorded.</td></tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id}>
                          <td className="font-semibold">{log.user_name || 'System'}</td>
                          <td>{log.user_email || 'N/A'}</td>
                          <td>
                            <span className="badge badge-allocated" style={{ fontSize: '0.7rem' }}>
                              {log.user_role || 'System'}
                            </span>
                          </td>
                          <td className="font-semibold text-warning">{log.action}</td>
                          <td>{log.details}</td>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
