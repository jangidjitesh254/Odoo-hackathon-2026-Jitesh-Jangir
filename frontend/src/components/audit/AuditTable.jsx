import React from 'react';

/**
 * AuditTable - Formatted tabular data list for audits.
 *
 * @param {Object} props
 * @param {Array<Object>} props.records - List of filtered audit items
 * @param {function} props.onViewRecord - Callback to view details of an audit
 */
export default function AuditTable({ records, onViewRecord }) {
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'status-pill-completed';
      case 'Pending':
        return 'status-pill-pending';
      case 'Overdue':
        return 'status-pill-overdue';
      default:
        return '';
    }
  };

  return (
    <div className="audit-section-panel">
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Asset Name</th>
              <th>Asset ID</th>
              <th>Auditor</th>
              <th>Audit Date</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id}>
                  <td style={{ fontWeight: '600', color: 'var(--audit-text-dark)' }}>
                    {record.id}
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {record.assetName}
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--audit-text-muted)', fontSize: '0.8rem' }}>
                    {record.assetId}
                  </td>
                  <td>{record.auditor}</td>
                  <td>{record.date}</td>
                  <td>
                    <span className={`status-pill ${getStatusClass(record.status)}`}>
                      {record.status === 'Completed' && (
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'currentColor', borderRadius: '50%', marginRight: '4px' }}></span>
                      )}
                      {record.status === 'Pending' && (
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'currentColor', borderRadius: '50%', marginRight: '4px' }}></span>
                      )}
                      {record.status === 'Overdue' && (
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'currentColor', borderRadius: '50%', marginRight: '4px' }}></span>
                      )}
                      {record.status}
                    </span>
                  </td>
                  <td className="remarks-cell" title={record.remarks}>
                    {record.remarks || 'No remarks added.'}
                  </td>
                  <td>
                    <button
                      className="view-action-btn"
                      onClick={() => onViewRecord(record)}
                      aria-label={`View audit ${record.id} details`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="table-empty-state">
                    <svg
                      style={{ margin: '0 auto 0.75rem' }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <p style={{ fontWeight: '600', color: 'var(--audit-text-dark)', marginBottom: '0.25rem' }}>No audit records found</p>
                    <p style={{ fontSize: '0.825rem' }}>Try adjusting your search terms or filters to locate items.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
