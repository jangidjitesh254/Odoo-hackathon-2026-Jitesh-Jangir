import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AssetAllocation() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Focus states
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [conflictDetails, setConflictDetails] = useState(null);

  // Form states
  const [allocForm, setAllocForm] = useState({ asset_id: '', user_id: '', department_id: '', expected_return_date: '' });
  const [returnForm, setReturnForm] = useState({ condition: 'Good', return_notes: '' });
  const [transferForm, setTransferForm] = useState({ asset_id: '', to_user_id: '', to_department_id: '', remarks: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocRes, assetsRes, usersRes, deptsRes, transfersRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/assets'),
        api.get('/users'),
        api.get('/departments'),
        api.get('/transfers'),
      ]);
      setAllocations(allocRes.allocations || []);
      setAssets(assetsRes.assets || []);
      setUsers(usersRes.users || []);
      setDepartments(deptsRes.departments || []);
      setTransfers(transfersRes.transfers || []);
    } catch (err) {
      setError(err.message || 'Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setConflictDetails(null);

    try {
      await api.post('/allocations', allocForm);
      setSuccess('Asset allocated successfully');
      setShowAllocModal(false);
      // Reset form
      setAllocForm({ asset_id: '', user_id: '', department_id: '', expected_return_date: '' });
      loadData();
    } catch (err) {
      if (err.status === 409) {
        // Double allocation conflict
        setConflictDetails({
          assetId: allocForm.asset_id,
          message: err.message || err.data?.message,
          currentlyHeldBy: err.data?.currentlyHeldBy || 'another employee'
        });
      } else {
        setError(err.message || 'Failed to allocate asset');
      }
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedAlloc) return;

    try {
      await api.post(`/allocations/${selectedAlloc.id}/return`, returnForm);
      setSuccess('Asset returned and checked in successfully');
      setShowReturnModal(false);
      setSelectedAlloc(null);
      setReturnForm({ condition: 'Good', return_notes: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to process return');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/transfers', transferForm);
      setSuccess('Transfer request submitted successfully');
      setShowTransferModal(false);
      // Reset form
      setTransferForm({ asset_id: '', to_user_id: '', to_department_id: '', remarks: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to request transfer');
    }
  };

  const handleApproveTransfer = async (transferId) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/transfers/${transferId}/approve`);
      setSuccess('Transfer request approved and asset re-allocated');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve transfer');
    }
  };

  const handleRejectTransfer = async (transferId) => {
    setError('');
    setSuccess('');
    const remarks = prompt('Please enter rejection remarks:');
    if (remarks === null) return; // cancelled
    try {
      await api.post(`/transfers/${transferId}/reject`, { remarks });
      setSuccess('Transfer request rejected');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject transfer');
    }
  };

  // Convert conflict details into a transfer form
  const handleInitiateConflictTransfer = () => {
    const asset = assets.find(a => String(a.id) === String(conflictDetails.assetId));
    setTransferForm({
      asset_id: conflictDetails.assetId,
      to_user_id: user.id, // transfer to current requester
      to_department_id: '',
      remarks: `Request transfer of ${asset ? asset.name : 'asset'} from ${conflictDetails.currentlyHeldBy}`
    });
    setConflictDetails(null);
    setShowAllocModal(false);
    setShowTransferModal(true);
  };

  const openReturnModal = (alloc) => {
    setSelectedAlloc(alloc);
    setShowReturnModal(true);
  };

  const isElevated = ['Admin', 'AssetManager'].includes(user?.role);

  return (
    <div>
      {/* Allocation Action buttons */}
      <div className="quick-actions-row">
        {isElevated && (
          <button className="action-btn" onClick={() => setShowAllocModal(true)}>
            Allocate Asset
          </button>
        )}
        <button className="action-btn secondary" onClick={() => setShowTransferModal(true)}>
          Request Transfer
        </button>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Section: Possessions (Employee) or Active Allocations (Managers) */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <h3>{isElevated ? 'Active Asset Allocations' : 'My Possessed Assets'}</h3>
        </div>
        {loading ? (
          <div className="text-muted">Loading allocations...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>Possessor Name</th>
                  <th>Assigned Date</th>
                  <th>Expected Return</th>
                  {isElevated && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 ? (
                  <tr><td colSpan="6" className="text-muted text-center">No active allocations found.</td></tr>
                ) : (
                  allocations.map(al => (
                    <tr key={al.id}>
                      <td className="font-semibold text-info">{al.asset_tag}</td>
                      <td className="font-semibold">{al.asset_name}</td>
                      <td>{al.user_name || al.department_name || 'N/A'}</td>
                      <td>{new Date(al.allocation_date).toLocaleDateString()}</td>
                      <td>{al.expected_return_date ? new Date(al.expected_return_date).toLocaleDateString() : 'Continuous'}</td>
                      {isElevated && (
                        <td>
                          <button className="logout-btn" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => openReturnModal(al)}>
                            Check-in Return
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section: Transfer Requests */}
      <div className="section-card">
        <div className="section-header">
          <h3>Asset Transfer Requests</h3>
        </div>
        {loading ? (
          <div className="text-muted">Loading transfers...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>From User</th>
                  <th>Transfer To</th>
                  <th>Requested By</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  {(isElevated || user?.role === 'DepartmentHead') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr><td colSpan="8" className="text-muted text-center">No transfer requests logged.</td></tr>
                ) : (
                  transfers.map(tr => (
                    <tr key={tr.id}>
                      <td className="font-semibold text-info">{tr.asset_tag}</td>
                      <td className="font-semibold">{tr.asset_name}</td>
                      <td>{tr.from_user_name || <span className="text-muted">N/A</span>}</td>
                      <td>{tr.to_user_name || tr.to_department_name || 'N/A'}</td>
                      <td>{tr.requested_by_name}</td>
                      <td>{tr.remarks || 'None'}</td>
                      <td>
                        <span className={`badge ${
                          tr.status === 'Approved' ? 'badge-available' : 
                          tr.status === 'Pending' ? 'badge-reserved' : 'badge-lost'
                        }`}>
                          {tr.status}
                        </span>
                      </td>
                      {(isElevated || user?.role === 'DepartmentHead') && (
                        <td>
                          {tr.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleApproveTransfer(tr.id)}>
                                Approve
                              </button>
                              <button className="logout-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRejectTransfer(tr.id)}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Closed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate Asset Modal */}
      {showAllocModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Allocate Asset to Possession</h3>
              <button className="modal-close-btn" onClick={() => { setShowAllocModal(false); setConflictDetails(null); }}>&times;</button>
            </div>
            <form onSubmit={handleAllocateSubmit}>
              <div className="modal-body">
                {conflictDetails && (
                  <div className="form-alert form-alert-error" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>Conflict:</strong> {conflictDetails.message}</div>
                    <button type="button" className="action-btn" style={{ background: 'var(--warning)', alignSelf: 'flex-start' }} onClick={handleInitiateConflictTransfer}>
                      Request Transfer from {conflictDetails.currentlyHeldBy}
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label>Select Asset</label>
                  <select
                    className="form-control"
                    required
                    value={allocForm.asset_id}
                    onChange={(e) => setAllocForm({ ...allocForm, asset_id: e.target.value })}
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.asset_tag} - {a.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Allocate to User (Optional)</label>
                  <select
                    className="form-control"
                    value={allocForm.user_id}
                    onChange={(e) => setAllocForm({ ...allocForm, user_id: e.target.value, department_id: '' })}
                  >
                    <option value="">None (Select Department instead)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Allocate to Department (Optional)</label>
                  <select
                    className="form-control"
                    value={allocForm.department_id}
                    onChange={(e) => setAllocForm({ ...allocForm, department_id: e.target.value, user_id: '' })}
                  >
                    <option value="">None (Select User instead)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={allocForm.expected_return_date}
                    onChange={(e) => setAllocForm({ ...allocForm, expected_return_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => { setShowAllocModal(false); setConflictDetails(null); }}>Cancel</button>
                <button type="submit" className="action-btn">Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return check-in Modal */}
      {showReturnModal && selectedAlloc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Check-in Return: {selectedAlloc.asset_tag}</h3>
              <button className="modal-close-btn" onClick={() => setShowReturnModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Asset Return Condition</label>
                  <select
                    className="form-control"
                    required
                    value={returnForm.condition}
                    onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Return / Condition Notes</label>
                  <textarea
                    className="form-control"
                    value={returnForm.return_notes}
                    onChange={(e) => setReturnForm({ ...returnForm, return_notes: e.target.value })}
                    placeholder="Enter details about physical condition at check-in..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Process Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Asset Transfer</h3>
              <button className="modal-close-btn" onClick={() => setShowTransferModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Allocated Asset</label>
                  <select
                    className="form-control"
                    required
                    value={transferForm.asset_id}
                    onChange={(e) => setTransferForm({ ...transferForm, asset_id: e.target.value })}
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.asset_tag} - {a.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Transfer Target User (Optional)</label>
                  <select
                    className="form-control"
                    value={transferForm.to_user_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_user_id: e.target.value, to_department_id: '' })}
                  >
                    <option value="">None (Select Department instead)</option>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Transfer Target Department (Optional)</label>
                  <select
                    className="form-control"
                    value={transferForm.to_department_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_department_id: e.target.value, to_user_id: '' })}
                  >
                    <option value="">None (Select User instead)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Justification Remarks</label>
                  <textarea
                    className="form-control"
                    required
                    value={transferForm.remarks}
                    onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                    placeholder="Enter reason for requesting this transfer..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Request Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
