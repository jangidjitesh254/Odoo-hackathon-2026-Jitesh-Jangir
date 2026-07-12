import React, { useState, useMemo } from 'react';
import AuditCard from './AuditCard';
import AuditFilter from './AuditFilter';
import AuditTable from './AuditTable';
import './Audit.css';

// Initial dummy audit data
const INITIAL_AUDITS = [
  { id: 'AUD-2241', assetName: 'MacBook Pro 16" M3', assetId: 'AST-HW-0482', auditor: 'Robert Fox', date: '2026-07-10', status: 'Completed', remarks: 'Physical verification complete. Serial number verified. No damage detected. Software inventory matches registry profile.' },
  { id: 'AUD-2242', assetName: 'Server Rack Suite 4B', assetId: 'AST-DC-0021', auditor: 'Arlene McCoy', date: '2026-07-11', status: 'Completed', remarks: 'Backup cooling unit tested. Main server racks clean. Cable organizing ties replaced. Operating temperatures within baseline.' },
  { id: 'AUD-2243', assetName: 'Enterprise Firewall License', assetId: 'AST-SW-0891', auditor: 'Kristin Watson', date: '2026-07-14', status: 'Pending', remarks: 'Verification of licensing renewal contracts ongoing. Awaiting invoice verification from finance department.' },
  { id: 'AUD-2244', assetName: 'Warehouse Forklift T2', assetId: 'AST-EQ-1002', auditor: 'Albert Flores', date: '2026-07-04', status: 'Overdue', remarks: 'Inspection delayed due to technical floor operations. Needs immediate rescheduled maintenance.' },
  { id: 'AUD-2245', assetName: 'Office Ergonomic Chairs', assetId: 'AST-FN-2094', auditor: 'Arlene McCoy', date: '2026-07-12', status: 'Pending', remarks: 'Visual check in progress. Counting total units in Floor 3 and Floor 4 workspaces.' },
  { id: 'AUD-2246', assetName: 'HQ Backup Generator', assetId: 'AST-EQ-0055', auditor: 'Robert Fox', date: '2026-07-01', status: 'Completed', remarks: 'Annual generator inspection. Full load test successful. Diesel tank filled to 100% capacity.' },
  { id: 'AUD-2247', assetName: 'Cisco Core Switch 9300', assetId: 'AST-NW-0201', auditor: 'Kristin Watson', date: '2026-06-25', status: 'Overdue', remarks: 'Postponed due to active network deployment. Awaiting maintenance window approval.' },
  { id: 'AUD-2248', assetName: 'Database Server (Azure)', assetId: 'AST-CL-0012', auditor: 'Albert Flores', date: '2026-07-09', status: 'Completed', remarks: 'Cloud infrastructure access audits completed. Deleted 4 idle administrative accounts.' },
];

export default function AuditPage() {
  const [audits, setAudits] = useState(INITIAL_AUDITS);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [auditorFilter, setAuditorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal / Detail States
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
  
  // New Audit Form State
  const [newAudit, setNewAudit] = useState({
    assetName: '',
    assetId: '',
    auditor: 'Robert Fox',
    remarks: '',
  });

  // Extract unique list of auditors from database for the selector dropdown
  const auditorList = useMemo(() => {
    const list = audits.map((a) => a.auditor);
    return [...new Set(list)];
  }, [audits]);

  // Compute Static Card numbers based on current database state
  const stats = useMemo(() => {
    const total = audits.length;
    const completed = audits.filter((a) => a.status === 'Completed').length;
    const pending = audits.filter((a) => a.status === 'Pending').length;
    const overdue = audits.filter((a) => a.status === 'Overdue').length;
    return { total, completed, pending, overdue };
  }, [audits]);

  // Filter Logic (Client-side)
  const filteredAudits = useMemo(() => {
    return audits.filter((item) => {
      // 1. Search Query (Asset name or Asset ID)
      const matchesSearch =
        item.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Status
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      
      // 3. Auditor
      const matchesAuditor = auditorFilter ? item.auditor === auditorFilter : true;
      
      // 4. Date (reference date is 2026-07-12)
      let matchesDate = true;
      if (dateFilter) {
        const refDate = new Date('2026-07-12');
        const itemDate = new Date(item.date);
        const timeDiff = refDate - itemDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (dateFilter === '7days') {
          matchesDate = daysDiff >= 0 && daysDiff <= 7;
        } else if (dateFilter === '30days') {
          matchesDate = daysDiff >= 0 && daysDiff <= 30;
        } else if (dateFilter === '90days') {
          matchesDate = daysDiff >= 0 && daysDiff <= 90;
        }
      }

      return matchesSearch && matchesStatus && matchesAuditor && matchesDate;
    });
  }, [audits, searchQuery, statusFilter, auditorFilter, dateFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setAuditorFilter('');
    setDateFilter('');
  };

  // Action: Add simulated Audit record
  const handleCreateAudit = (e) => {
    e.preventDefault();
    if (!newAudit.assetName || !newAudit.assetId) {
      alert('Please enter Asset Name and Asset ID.');
      return;
    }

    const newRecord = {
      id: `AUD-${Math.floor(2000 + Math.random() * 9000)}`,
      assetName: newAudit.assetName,
      assetId: newAudit.assetId,
      auditor: newAudit.auditor,
      date: '2026-07-12', // today
      status: 'Pending',
      remarks: newAudit.remarks || 'Awaiting audit inspection.',
    };

    setAudits((prev) => [newRecord, ...prev]);
    setIsNewAuditModalOpen(false);
    setNewAudit({ assetName: '', assetId: '', auditor: 'Robert Fox', remarks: '' });
  };

  // Action: Download CSV Report of current filtered list
  const handleDownloadReport = () => {
    if (filteredAudits.length === 0) {
      alert('No records available to download.');
      return;
    }

    // CSV Headers
    let csvContent = 'Audit ID,Asset Name,Asset ID,Auditor,Audit Date,Status,Remarks\n';
    
    // Rows
    filteredAudits.forEach((r) => {
      const row = [
        r.id,
        `"${r.assetName.replace(/"/g, '""')}"`,
        r.assetId,
        `"${r.auditor.replace(/"/g, '""')}"`,
        r.date,
        r.status,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AssetFlow_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Quick actions - Schedule audit simulation
  const handleScheduleAudit = () => {
    alert('Scheduler interface active: Selected auditor will be emailed details automatically. (Simulated)');
  };

  return (
    <div className="audit-page-container">
      {/* Header */}
      <div className="audit-page-header">
        <h1>Audit Management</h1>
        <p>Monitor and manage all system and physical asset audits.</p>
      </div>

      {/* Statistics Cards */}
      <div className="audit-stats-grid">
        <AuditCard
          title="Total Audits"
          value={stats.total}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          }
          trendText="All records"
          trendDirection="stable"
        />
        <AuditCard
          title="Completed Audits"
          value={stats.completed}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          }
          trendText={`${Math.round((stats.completed / (stats.total || 1)) * 100)}% completion`}
          trendDirection="up"
        />
        <AuditCard
          title="Pending Audits"
          value={stats.pending}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          }
          trendText="Awaiting check"
          trendDirection="stable"
        />
        <AuditCard
          title="Overdue Audits"
          value={stats.overdue}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          }
          trendText="Action required"
          trendDirection="down"
        />
      </div>

      {/* Main Grid Content */}
      <div className="audit-main-content-layout">
        
        {/* Left: Filters and Table */}
        <div className="audit-left-section">
          <AuditFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            auditorFilter={auditorFilter}
            onAuditorChange={setAuditorFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            auditorList={auditorList}
            onClearFilters={handleClearFilters}
          />
          
          <AuditTable
            records={filteredAudits}
            onViewRecord={setSelectedAudit}
          />
        </div>

        {/* Right: Quick Actions and Recent Activity */}
        <div className="audit-right-section">
          
          {/* Quick Actions Panel */}
          <div className="right-section-card">
            <h2 className="right-section-title">Quick Actions</h2>
            <div className="quick-actions-list">
              <button
                className="action-btn action-btn-primary"
                onClick={() => setIsNewAuditModalOpen(true)}
              >
                <span className="action-btn-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </span>
                Start New Audit
              </button>

              <button className="action-btn" onClick={handleScheduleAudit}>
                <span className="action-btn-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
                Schedule Audit
              </button>

              <button className="action-btn" onClick={handleDownloadReport}>
                <span className="action-btn-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </span>
                Download Report
              </button>
            </div>
          </div>

          {/* Recent Audit Activity Panel */}
          <div className="right-section-card">
            <h2 className="right-section-title">Recent Activity</h2>
            <div className="activity-timeline">
              
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="activity-desc">
                    <strong>Robert Fox</strong> completed audit on <strong>MacBook Pro 16"</strong>
                  </p>
                  <span className="activity-meta">July 10, 2026 • 2:40 PM</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="activity-desc">
                    <strong>Arlene McCoy</strong> started inspection of <strong>Office Chairs</strong>
                  </p>
                  <span className="activity-meta">July 12, 2026 • 10:15 AM</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="activity-desc">
                    <strong>AUD-2244</strong> forklift audit flagged as <strong>Overdue</strong>
                  </p>
                  <span className="activity-meta">July 04, 2026 • 12:00 AM</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="activity-desc">
                    <strong>Albert Flores</strong> marked <strong>Azure DB</strong> as compliant
                  </p>
                  <span className="activity-meta">July 09, 2026 • 4:30 PM</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: Detail Remarks Popup */}
      {selectedAudit && (
        <div className="remarks-modal-overlay" onClick={() => setSelectedAudit(null)}>
          <div className="remarks-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Audit Remarks Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAudit(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-info-grid">
                <div>
                  <span className="info-item-label">Audit ID</span>
                  <div className="info-item-value">{selectedAudit.id}</div>
                </div>
                <div>
                  <span className="info-item-label">Asset ID</span>
                  <div className="info-item-value" style={{ fontFamily: 'monospace' }}>{selectedAudit.assetId}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="info-item-label">Asset Name</span>
                  <div className="info-item-value">{selectedAudit.assetName}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="info-item-label">Auditor</span>
                  <div className="info-item-value">{selectedAudit.auditor}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="info-item-label">Audit Date</span>
                  <div className="info-item-value">{selectedAudit.date}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="info-item-label">Audit Status</span>
                  <div className="info-item-value">
                    <span className={`status-pill status-pill-${selectedAudit.status.toLowerCase()}`}>
                      {selectedAudit.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="modal-remarks-section">
                <span className="modal-remarks-label">Detailed Notes / Remarks:</span>
                <p className="modal-remarks-content">{selectedAudit.remarks}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setSelectedAudit(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Start New Audit Form Modal */}
      {isNewAuditModalOpen && (
        <div className="remarks-modal-overlay" onClick={() => setIsNewAuditModalOpen(false)}>
          <div className="remarks-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start New Asset Audit</h3>
              <button className="modal-close-btn" onClick={() => setIsNewAuditModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateAudit}>
              <div className="modal-body" style={{ gap: '1.1rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label htmlFor="assetName" className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Asset Name *</label>
                  <input
                    type="text"
                    id="assetName"
                    className="input-field"
                    style={{ padding: '0.625rem' }}
                    placeholder="e.g. Dell Monitor 27"
                    value={newAudit.assetName}
                    onChange={(e) => setNewAudit(prev => ({ ...prev, assetName: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label htmlFor="assetId" className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Asset ID *</label>
                  <input
                    type="text"
                    id="assetId"
                    className="input-field"
                    style={{ padding: '0.625rem' }}
                    placeholder="e.g. AST-HW-9941"
                    value={newAudit.assetId}
                    onChange={(e) => setNewAudit(prev => ({ ...prev, assetId: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label htmlFor="auditorSelect" className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Assign Auditor</label>
                  <select
                    id="auditorSelect"
                    className="filter-select"
                    style={{ backgroundColor: 'var(--audit-bg-card)' }}
                    value={newAudit.auditor}
                    onChange={(e) => setNewAudit(prev => ({ ...prev, auditor: e.target.value }))}
                  >
                    <option value="Robert Fox">Robert Fox</option>
                    <option value="Arlene McCoy">Arlene McCoy</option>
                    <option value="Kristin Watson">Kristin Watson</option>
                    <option value="Albert Flores">Albert Flores</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label htmlFor="remarks" className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Remarks / Initial Notes</label>
                  <textarea
                    id="remarks"
                    className="input-field"
                    style={{ padding: '0.625rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="Enter audit check notes..."
                    value={newAudit.remarks}
                    onChange={(e) => setNewAudit(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ gap: '0.5rem' }}>
                <button
                  type="button"
                  className="view-action-btn"
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => setIsNewAuditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-close">
                  Add Audit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
