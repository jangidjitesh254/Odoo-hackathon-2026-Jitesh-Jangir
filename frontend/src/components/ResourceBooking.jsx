import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ResourceBooking() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals / Forms state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [bookingForm, setBookingForm] = useState({ asset_id: '', start_time: '', end_time: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch bookable assets only (is_bookable = 1)
      const [assetsRes, bookingsRes] = await Promise.all([
        api.get('/assets?is_bookable=true'),
        api.get(selectedResourceId ? `/bookings?asset_id=${selectedResourceId}` : '/bookings')
      ]);
      setResources(assetsRes.assets || []);
      setBookings(bookingsRes.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedResourceId]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bookingForm.asset_id || !bookingForm.start_time || !bookingForm.end_time) {
      setError('Resource, start time, and end time are required.');
      return;
    }

    try {
      await api.post('/bookings', bookingForm);
      setSuccess('Booking created successfully!');
      setShowBookModal(false);
      setBookingForm({ asset_id: '', start_time: '', end_time: '' });
      loadData();
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to create booking due to scheduling conflicts.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setError('');
    setSuccess('');
    try {
      await api.put(`/bookings/${bookingId}/cancel`, {});
      setSuccess('Booking cancelled successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  const openBookModal = (resourceId = '') => {
    setBookingForm({ asset_id: resourceId, start_time: '', end_time: '' });
    setShowBookModal(true);
  };

  return (
    <div>
      {/* Quick Booking trigger */}
      <div className="quick-actions-row">
        <button className="action-btn" onClick={() => openBookModal('')}>
          + Reserve a Resource
        </button>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Grid view of shared resources */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <h3>Shared Bookable Resources</h3>
          <div style={{ width: '220px' }}>
            <select
              className="form-control"
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
            >
              <option value="">All Shared Resources</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.asset_tag})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {resources.length === 0 ? (
            <div className="text-muted">No shared bookable resources registered.</div>
          ) : (
            resources.map(resource => (
              <div key={resource.id} className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="font-semibold" style={{ fontSize: '1.1rem' }}>{resource.name}</div>
                  <span className={`badge ${resource.status === 'Available' ? 'badge-available' : 'badge-maintenance'}`}>
                    {resource.status}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Tag: {resource.asset_tag} | Location: {resource.location || 'N/A'}</div>
                <button
                  className="action-btn secondary"
                  style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                  disabled={['Retired', 'Disposed', 'Lost'].includes(resource.status)}
                  onClick={() => openBookModal(resource.id)}
                >
                  Book Slot
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section: Calendar / visual Schedule List */}
      <div className="section-card">
        <div className="section-header">
          <h3>Active Reservation Schedule</h3>
        </div>
        {loading ? (
          <div className="text-muted">Loading schedule...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Tag</th>
                  <th>Reserved By</th>
                  <th>Start Date/Time</th>
                  <th>End Date/Time</th>
                  <th>Booking Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan="7" className="text-muted text-center">No active bookings recorded in this scope.</td></tr>
                ) : (
                  bookings.map(book => {
                    const isOwner = book.user_id === user?.id;
                    const canCancel = (isOwner || ['AssetManager', 'Admin'].includes(user?.role)) && book.status !== 'Cancelled';
                    return (
                      <tr key={book.id}>
                        <td className="font-semibold">{book.asset_name}</td>
                        <td>{book.asset_tag}</td>
                        <td>{book.user_name} {isOwner && <span className="badge badge-allocated">Me</span>}</td>
                        <td>{new Date(book.start_time).toLocaleString()}</td>
                        <td>{new Date(book.end_time).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${
                            book.status === 'Cancelled' ? 'badge-lost' : 
                            book.status === 'Ongoing' ? 'badge-available' : 'badge-allocated'
                          }`}>
                            {book.status}
                          </span>
                        </td>
                        <td>
                          {canCancel ? (
                            <button
                              className="logout-btn"
                              style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--danger-bg)' }}
                              onClick={() => handleCancelBooking(book.id)}
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Closed</span>
                          )}
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

      {/* Booking Form Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reserve Shared Resource</h3>
              <button className="modal-close-btn" onClick={() => setShowBookModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Resource</label>
                  <select
                    className="form-control"
                    required
                    value={bookingForm.asset_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, asset_id: e.target.value })}
                  >
                    <option value="">Choose Room/Vehicle/Equipment</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.asset_tag} - {r.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Book Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
