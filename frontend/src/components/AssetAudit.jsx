import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AssetAudit() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [scopedAssets, setScopedAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [discrepancyReport, setDiscrepancyReport] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form states
  const [cycleForm, setCycleForm] = useState({ name: '', scope_department_id: '', scope_location: '', start_date: '', end_date: '' });
  const [verifyForm, setVerifyForm] = useState({ verification_status: 'Verified', notes: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesRes, deptsRes] = await Promise.all([
        api.get('/audits/cycles'),
        api.get('/departments')
      ]);
      setCycles(cyclesRes.cycles || []);
      setDepartments(deptsRes.departments || []);
    } catch (err) {
      setError(err.message || 'Failed to load audit cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCycleAssetsAndReport = async (cycleId) => {
    if (!cycleId) {
      setScopedAssets([]);
      setDiscrepancyReport(null);
      return;
    }
    try {
      const [assetsRes, reportRes] = await Promise.all([
        api.get(`/audits/cycles/${cycleId}/assets`),
        api.get(`/audits/cycles/${cycleId}/report`)
      ]);
      setScopedAssets(assetsRes.assets || []);
      setDiscrepancyReport(reportRes);
    } catch (err) {
      setError(err.message || 'Failed to load cycle assets');
    }
  };

  useEffect(() => {
    loadCycleAssetsAndReport(selectedCycleId);
  }, [selectedCycleId]);

  const handleCreateCycleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/audits/cycles', cycleForm);
      setSuccess(`Audit cycle created successfully with ${res.assetsScopedCount} assets in scope.`);
      setShowCreateModal(false);
      setCycleForm({ name: '', scope_department_id: '', scope_location: '', start_date: '', end_date: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create audit cycle');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedAsset) return;

    try {
      await api.put(`/audits/cycles/${selectedCycleId}/assets/${selectedAsset.asset_id}`, verifyForm);
      setSuccess(`Asset ${selectedAsset.asset_tag} verified as ${verifyForm.verification_status}`);
      setShowVerifyModal(false);
      setSelectedAsset(null);
      setVerifyForm({ verification_status: 'Verified', notes: '' });
      loadCycleAssetsAndReport(selectedCycleId);
    } catch (err) {
      setError(err.message || 'Failed to update verification status');
    }
  };

  const handleCloseCycle = async () => {
    if (!window.confirm('Closing the audit cycle will lock all verification records and update missing items to LOST in main inventory. Proceed?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/audits/cycles/${selectedCycleId}/close`, {});
      setSuccess(`Audit cycle closed successfully. Locked ${res.missingCount} Lost and ${res.damagedCount} Damaged updates.`);
      loadData();
      loadCycleAssetsAndReport(selectedCycleId);
    } catch (err) {
      setError(err.message || 'Failed to close audit cycle');
    }
  };

  const isManager = ['Admin', 'AssetManager'].includes(user?.role);
  const selectedCycle = cycles.find(c => String(c.id) === String(selectedCycleId));

  return (
    <div>
      {/* Create Cycle triggering */}
      <div className="quick-actions-row">
        {isManager && (
          <button className="action-btn" onClick={() => setShowCreateModal(true)}>
            + Start Audit Cycle
          </button>
        )}
        <div style={{ width: '260px' }}>
          <select
            className="form-control"
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
          >
            <option value="">Select Audit Cycle</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {selectedCycleId ? (
        <>
          {/* Active Cycle Control info */}
          <div className="section-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <h3>{selectedCycle?.name} Details</h3>
                <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Scope: {selectedCycle?.scope_location ? `Location: ${selectedCycle.scope_location}` : ''} 
                  {selectedCycle?.scope_department_id ? ` Department: ${selectedCycle.department_name}` : ''}
                  {!selectedCycle?.scope_location && !selectedCycle?.scope_department_id ? 'All Assets' : ''} 
                  {' | '} Range: {selectedCycle?.start_date} to {selectedCycle?.end_date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className={`badge ${selectedCycle?.status === 'Completed' ? 'badge-retired' : 'badge-available'}`}>
                  {selectedCycle?.status}
                </span>
                {isManager && selectedCycle?.status === 'Active' && (
                  <button className="action-btn" style={{ background: 'var(--danger)' }} onClick={handleCloseCycle}>
                    Close & Lock Cycle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Verification sheets & discrepancy reports in a grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Scoped assets table list */}
            <div className="section-card">
              <div className="section-header">
                <h3>Cycle Asset Checksheet</h3>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Asset Name</th>
                      <th>Expected Location</th>
                      <th>Verification Status</th>
                      <th>Notes</th>
                      {selectedCycle?.status === 'Active' && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {scopedAssets.length === 0 ? (
                      <tr><td colSpan="6" className="text-muted text-center">No scoped assets in this cycle.</td></tr>
                    ) : (
                      scopedAssets.map(item => (
                        <tr key={item.id}>
                          <td className="font-semibold text-info">{item.asset_tag}</td>
                          <td className="font-semibold">{item.asset_name}</td>
                          <td>{item.location || 'N/A'}</td>
                          <td>
                            <span className={`badge ${
                              item.verification_status === 'Verified' ? 'badge-available' :
                              item.verification_status === 'Missing' ? 'badge-lost' :
                              item.verification_status === 'Damaged' ? 'badge-reserved' : 'badge-retired'
                            }`}>
                              {item.verification_status}
                            </span>
                          </td>
                          <td>{item.notes || 'N/A'}</td>
                          {selectedCycle?.status === 'Active' && (
                            <td>
                              <button
                                className="logout-btn"
                                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                onClick={() => {
                                  setSelectedAsset(item);
                                  setVerifyForm({ verification_status: item.verification_status === 'Pending' ? 'Verified' : item.verification_status, notes: item.notes || '' });
                                  setShowVerifyModal(true);
                                }}
                              >
                                Verify
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discrepancy sheet */}
            <div className="section-card">
              <div className="section-header">
                <h3 className="text-danger">Discrepancy Report</h3>
              </div>
              {discrepancyReport?.discrepancies?.length === 0 ? (
                <div className="text-success font-semibold" style={{ padding: '1rem 0' }}>Perfect Match! No missing or damaged items flagged.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Asset Tag</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discrepancyReport?.discrepancies?.map(disc => (
                        <tr key={disc.id}>
                          <td className="font-semibold text-info">{disc.asset_tag}</td>
                          <td>{disc.asset_name}</td>
                          <td>
                            <span className={`badge ${disc.verification_status === 'Missing' ? 'badge-lost' : 'badge-reserved'}`}>
                              {disc.verification_status}
                            </span>
                          </td>
                          <td>{disc.notes || 'No log details'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="section-card">
          <div className="text-muted text-center" style={{ padding: '3rem 0' }}>
            Please select an active or past audit cycle from the dropdown above to view scope details.
          </div>
        </div>
      )}

      {/* Start Cycle Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Verification Audit Cycle</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateCycleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Audit Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={cycleForm.name}
                    onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                    placeholder="e.g. Q3 Electronics Audit"
                  />
                </div>
                <div className="form-group">
                  <label>Scope by Department (Optional)</label>
                  <select
                    className="form-control"
                    value={cycleForm.scope_department_id}
                    onChange={(e) => setCycleForm({ ...cycleForm, scope_department_id: e.target.value })}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Scope by Storage/Location (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cycleForm.scope_location}
                    onChange={(e) => setCycleForm({ ...cycleForm, scope_location: e.target.value })}
                    placeholder="e.g. HQ 2nd Floor"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={cycleForm.start_date}
                    onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={cycleForm.end_date}
                    onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Initialize Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Asset Modal */}
      {showVerifyModal && selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Verify Asset: {selectedAsset.asset_tag}</h3>
              <button className="modal-close-btn" onClick={() => setShowVerifyModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleVerifySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Verification Result</label>
                  <select
                    className="form-control"
                    required
                    value={verifyForm.verification_status}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verification_status: e.target.value })}
                  >
                    <option value="Verified">Verified (In possession & matching records)</option>
                    <option value="Missing">Missing (Not found in location)</option>
                    <option value="Damaged">Damaged (Defect detected)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Auditor Verification Notes</label>
                  <textarea
                    className="form-control"
                    value={verifyForm.notes}
                    onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
                    placeholder="Enter observation notes, serial validation, etc."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Update Check</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
