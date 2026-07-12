import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AssetDirectory() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '', is_bookable: '' });

  // Modals state
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState({ allocations: [], maintenance: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states for new registration
  const [regForm, setRegForm] = useState({
    name: '',
    category_id: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: '',
    condition: 'Good',
    location: '',
    photo_url: '',
    documents_url: '',
    is_bookable: false
  });

  const isElevated = ['Admin', 'AssetManager'].includes(user?.role);

  // Load assets & categories
  const loadAssets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category_id) queryParams.append('category_id', filters.category_id);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.is_bookable) queryParams.append('is_bookable', filters.is_bookable);

      const [assetsData, catsData] = await Promise.all([
        api.get(`/assets?${queryParams.toString()}`),
        api.get('/categories')
      ]);

      setAssets(assetsData.assets || []);
      setCategories(catsData.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [filters]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!regForm.name || !regForm.category_id) {
      setError('Asset name and category are required.');
      return;
    }

    try {
      const payload = {
        ...regForm,
        acquisition_cost: parseFloat(regForm.acquisition_cost) || 0.0,
        is_bookable: regForm.is_bookable ? 1 : 0
      };

      await api.post('/assets', payload);
      setSuccess('Asset registered successfully');
      setShowRegModal(false);
      
      // Reset form
      setRegForm({
        name: '',
        category_id: '',
        serial_number: '',
        acquisition_date: '',
        acquisition_cost: '',
        condition: 'Good',
        location: '',
        photo_url: '',
        documents_url: '',
        is_bookable: false
      });

      // Reload
      loadAssets();
    } catch (err) {
      setError(err.message || 'Failed to register asset');
    }
  };

  const handleViewAssetDetails = async (asset) => {
    setSelectedAsset(asset);
    setLoadingHistory(true);
    setAssetHistory({ allocations: [], maintenance: [] });
    try {
      const [allocRes, maintRes] = await Promise.all([
        api.get(`/allocations/history/${asset.id}`),
        api.get(`/maintenance?asset_id=${asset.id}`)
      ]);
      setAssetHistory({
        allocations: allocRes.history || [],
        maintenance: maintRes.requests || []
      });
    } catch (err) {
      console.error('Failed to load asset histories:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status) => {
    const classMap = {
      'Available': 'badge-available',
      'Allocated': 'badge-allocated',
      'Reserved': 'badge-reserved',
      'Under Maintenance': 'badge-maintenance',
      'Lost': 'badge-lost',
      'Retired': 'badge-retired',
      'Disposed': 'badge-disposed'
    };
    return <span className={`badge ${classMap[status] || 'badge-retired'}`}>{status}</span>;
  };

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search by tag, name, serial or location..."
              className="form-control"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Lifecycles</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={filters.is_bookable}
              onChange={(e) => setFilters({ ...filters, is_bookable: e.target.value })}
            >
              <option value="">All Bookability</option>
              <option value="true">Shared/Bookable</option>
              <option value="false">Unbookable/Static</option>
            </select>
          </div>
          {isElevated && (
            <button className="action-btn" onClick={() => setShowRegModal(true)}>+ Register Asset</button>
          )}
        </div>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Main Asset Directory Table */}
      <div className="section-card">
        <div className="section-header">
          <h3>Asset Directory Listing</h3>
          <span className="badge badge-allocated">{assets.length} items found</span>
        </div>
        {loading ? (
          <div className="text-muted">Filtering assets inventory...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th>Location</th>
                  <th>Bookable</th>
                  <th>Condition</th>
                  <th>Lifecycle Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan="9" className="text-muted text-center">No assets matched the filters.</td></tr>
                ) : (
                  assets.map(asset => (
                    <tr key={asset.id}>
                      <td className="font-semibold text-info" style={{ cursor: 'pointer' }} onClick={() => handleViewAssetDetails(asset)}>
                        {asset.asset_tag}
                      </td>
                      <td className="font-semibold">{asset.name}</td>
                      <td>{asset.category_name}</td>
                      <td>{asset.serial_number || <span className="text-muted">N/A</span>}</td>
                      <td>{asset.location || <span className="text-muted">N/A</span>}</td>
                      <td>
                        <span className={`badge ${asset.is_bookable === 1 ? 'badge-available' : 'badge-retired'}`}>
                          {asset.is_bookable === 1 ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{asset.condition}</td>
                      <td>{getStatusBadge(asset.status)}</td>
                      <td>
                        <button className="logout-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => handleViewAssetDetails(asset)}>
                          History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset History / Details Drawer Modal */}
      {selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Asset details: {selectedAsset.asset_tag} ({selectedAsset.name})</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAsset(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>Category:</strong> {selectedAsset.category_name}</div>
                <div><strong>Serial Number:</strong> {selectedAsset.serial_number || 'N/A'}</div>
                <div><strong>Acquisition Cost:</strong> ${selectedAsset.acquisition_cost}</div>
                <div><strong>Acquisition Date:</strong> {selectedAsset.acquisition_date}</div>
                <div><strong>Condition:</strong> {selectedAsset.condition}</div>
                <div><strong>Location:</strong> {selectedAsset.location || 'N/A'}</div>
              </div>

              {loadingHistory ? (
                <div className="text-muted">Loading asset history...</div>
              ) : (
                <>
                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Allocation History</h4>
                  {assetHistory.allocations.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>No allocation history recorded for this asset.</p>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                      <thead>
                        <tr>
                          <th>Assigned To</th>
                          <th>Allocation Date</th>
                          <th>Return Date</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetHistory.allocations.map(al => (
                          <tr key={al.id}>
                            <td>{al.user_name || al.department_name || 'N/A'}</td>
                            <td>{new Date(al.allocation_date).toLocaleDateString()}</td>
                            <td>{al.returned_date ? new Date(al.returned_date).toLocaleDateString() : <span className="text-info font-semibold">Active Possession</span>}</td>
                            <td>{al.return_notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Maintenance History</h4>
                  {assetHistory.maintenance.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>No maintenance history recorded for this asset.</p>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th>Description</th>
                          <th>Resolved Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetHistory.maintenance.map(m => (
                          <tr key={m.id}>
                            <td>{m.technician_name || 'None assigned'}</td>
                            <td>{m.description}</td>
                            <td>{m.resolved_date ? new Date(m.resolved_date).toLocaleDateString() : 'Active Repair'}</td>
                            <td>{m.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setSelectedAsset(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Register Form Modal */}
      {showRegModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Physical Asset</h3>
              <button className="modal-close-btn" onClick={() => setShowRegModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Asset Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    className="form-control"
                    required
                    value={regForm.category_id}
                    onChange={(e) => setRegForm({ ...regForm, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={regForm.serial_number}
                    onChange={(e) => setRegForm({ ...regForm, serial_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Acquisition Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={regForm.acquisition_date}
                    onChange={(e) => setRegForm({ ...regForm, acquisition_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Acquisition Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={regForm.acquisition_cost}
                    onChange={(e) => setRegForm({ ...regForm, acquisition_cost: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Condition</label>
                  <select
                    className="form-control"
                    value={regForm.condition}
                    onChange={(e) => setRegForm({ ...regForm, condition: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Storage / Current Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="is_bookable"
                    checked={regForm.is_bookable}
                    onChange={(e) => setRegForm({ ...regForm, is_bookable: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_bookable" style={{ margin: 0, cursor: 'pointer' }}>Mark as a shared/bookable resource (Room, Vehicle, etc.)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowRegModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
