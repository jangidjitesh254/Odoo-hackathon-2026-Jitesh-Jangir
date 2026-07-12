import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]); // to select technician
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  
  // Selected state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignTechId, setAssignTechId] = useState({});

  // Forms state
  const [raiseForm, setRaiseForm] = useState({ asset_id: '', description: '', priority: 'Medium', photo_url: '' });
  const [resolveForm, setResolveForm] = useState({ resolution_notes: '', condition: 'Good' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintRes, assetsRes, usersRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets'),
        api.get('/users'),
      ]);
      setRequests(maintRes.requests || []);
      setAssets(assetsRes.assets || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!raiseForm.asset_id || !raiseForm.description) {
      setError('Asset and problem description are required');
      return;
    }

    try {
      await api.post('/maintenance', raiseForm);
      setSuccess('Maintenance request successfully raised');
      setShowRaiseModal(false);
      setRaiseForm({ asset_id: '', description: '', priority: 'Medium', photo_url: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to raise request');
    }
  };

  const handleStatusChange = async (requestId, status, additionalPayload = {}) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/maintenance/${requestId}/status`, { status, ...additionalPayload });
      setSuccess(`Maintenance request successfully updated to ${status}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update request status');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedRequest) return;

    try {
      await api.put(`/maintenance/${selectedRequest.id}/status`, {
        status: 'Resolved',
        ...resolveForm
      });
      setSuccess('Maintenance request successfully marked as Resolved. Asset is now Available.');
      setShowResolveModal(false);
      setSelectedRequest(null);
      setResolveForm({ resolution_notes: '', condition: 'Good' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to resolve request');
    }
  };

  const isManager = ['Admin', 'AssetManager'].includes(user?.role);

  return (
    <div>
      {/* Raise button */}
      <div className="quick-actions-row">
        <button className="action-btn" onClick={() => setShowRaiseModal(true)}>
          + Raise Maintenance Request
        </button>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Requests table listing */}
      <div className="section-card">
        <div className="section-header">
          <h3>Maintenance Flow Logs</h3>
        </div>
        {loading ? (
          <div className="text-muted">Loading maintenance flow...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Asset</th>
                  <th>Tag</th>
                  <th>Requester</th>
                  <th>Problem Details</th>
                  <th>Priority</th>
                  <th>Assigned Tech</th>
                  <th>Work Status</th>
                  <th>Actions Workflow</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan="9" className="text-muted text-center">No maintenance logs matching access rights.</td></tr>
                ) : (
                  requests.map(req => {
                    const isAssignedTech = req.assigned_technician_id === user.id;
                    const canResolve = isAssignedTech || isManager;
                    return (
                      <tr key={req.id}>
                        <td>MR-{String(req.id).padStart(4, '0')}</td>
                        <td className="font-semibold">{req.asset_name}</td>
                        <td className="text-info">{req.asset_tag}</td>
                        <td>{req.requester_name}</td>
                        <td>{req.description}</td>
                        <td>
                          <span className={`badge ${
                            req.priority === 'Critical' ? 'badge-lost' :
                            req.priority === 'High' ? 'badge-reserved' : 'badge-allocated'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td>
                          {req.technician_name ? (
                            req.technician_name
                          ) : isManager && req.status === 'Approved' ? (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <select
                                className="form-control"
                                style={{ padding: '0.2rem', width: '130px', fontSize: '0.8rem' }}
                                value={assignTechId[req.id] || ''}
                                onChange={(e) => setAssignTechId({ ...assignTechId, [req.id]: e.target.value })}
                              >
                                <option value="">Select Tech</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                              <button
                                className="action-btn"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                                onClick={() => handleStatusChange(req.id, 'Technician Assigned', { assigned_technician_id: assignTechId[req.id] })}
                              >
                                Assign
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            req.status === 'Resolved' ? 'badge-available' :
                            req.status === 'Pending' ? 'badge-reserved' : 'badge-allocated'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {isManager && req.status === 'Pending' && (
                              <>
                                <button className="action-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleStatusChange(req.id, 'Approved')}>
                                  Approve
                                </button>
                                <button className="logout-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleStatusChange(req.id, 'Rejected')}>
                                  Reject
                                </button>
                              </>
                            )}

                            {req.status === 'Technician Assigned' && canResolve && (
                              <button className="action-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--info)' }} onClick={() => handleStatusChange(req.id, 'In Progress')}>
                                Start Repair
                              </button>
                            )}

                            {req.status === 'In Progress' && canResolve && (
                              <button
                                className="action-btn"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--success)' }}
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setShowResolveModal(true);
                                }}
                              >
                                Mark Resolved
                              </button>
                            )}

                            {['Resolved', 'Rejected'].includes(req.status) && (
                              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raise Request Modal */}
      {showRaiseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Raise Maintenance Request</h3>
              <button className="modal-close-btn" onClick={() => setShowRaiseModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRaiseSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Asset</label>
                  <select
                    className="form-control"
                    required
                    value={raiseForm.asset_id}
                    onChange={(e) => setRaiseForm({ ...raiseForm, asset_id: e.target.value })}
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.asset_tag} - {a.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    className="form-control"
                    value={raiseForm.priority}
                    onChange={(e) => setRaiseForm({ ...raiseForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Issue Description</label>
                  <textarea
                    className="form-control"
                    required
                    value={raiseForm.description}
                    onChange={(e) => setRaiseForm({ ...raiseForm, description: e.target.value })}
                    placeholder="Provide details about the defect, squeaking,sticky keys, error messages, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Photo URL (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={raiseForm.photo_url}
                    onChange={(e) => setRaiseForm({ ...raiseForm, photo_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowRaiseModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Request Modal */}
      {showResolveModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Resolve Maintenance: MR-{String(selectedRequest.id).padStart(4, '0')}</h3>
              <button className="modal-close-btn" onClick={() => setShowResolveModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleResolveSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Post-Repair Asset Condition</label>
                  <select
                    className="form-control"
                    required
                    value={resolveForm.condition}
                    onChange={(e) => setResolveForm({ ...resolveForm, condition: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Resolution Action Log Notes</label>
                  <textarea
                    className="form-control"
                    required
                    value={resolveForm.resolution_notes}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolution_notes: e.target.value })}
                    placeholder="Describe what repair actions were taken to fix the issue..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Complete Resolution</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
