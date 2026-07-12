import React from 'react';

/**
 * AuditFilter - Search and Filter controls for audits.
 *
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query value
 * @param {function} props.onSearchChange - Search onChange handler
 * @param {string} props.statusFilter - Selected status filter
 * @param {function} props.onStatusChange - Status dropdown onChange handler
 * @param {string} props.auditorFilter - Selected auditor filter
 * @param {function} props.onAuditorChange - Auditor dropdown onChange handler
 * @param {string} props.dateFilter - Selected date range filter
 * @param {function} props.onDateChange - Date dropdown onChange handler
 * @param {Array<string>} props.auditorList - List of unique auditor names for the dropdown selection
 * @param {function} props.onClearFilters - Handler to reset all filter values
 */
export default function AuditFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  auditorFilter,
  onAuditorChange,
  dateFilter,
  onDateChange,
  auditorList = [],
  onClearFilters,
}) {
  const hasActiveFilters = searchQuery || statusFilter || auditorFilter || dateFilter;

  return (
    <div className="audit-section-panel">
      <div className="audit-filter-panel">
        
        {/* Filter Inputs Grid */}
        <div className="filter-grid">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <span className="search-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-field"
              placeholder="Search by Asset Name or ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Auditor Filter */}
          <div>
            <select
              className="filter-select"
              value={auditorFilter}
              onChange={(e) => onAuditorChange(e.target.value)}
              aria-label="Filter by auditor"
            >
              <option value="">All Auditors</option>
              {auditorList.map((auditor, index) => (
                <option key={index} value={auditor}>
                  {auditor}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              className="filter-select"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Filter by audit date"
            >
              <option value="">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="filter-active-chips">
            <span className="filter-chip-label">Active Filters:</span>
            
            {searchQuery && (
              <span className="filter-chip">
                Search: "{searchQuery}"
                <button
                  className="filter-chip-remove"
                  onClick={() => onSearchChange('')}
                  aria-label="Remove search filter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            )}

            {statusFilter && (
              <span className="filter-chip">
                Status: {statusFilter}
                <button
                  className="filter-chip-remove"
                  onClick={() => onStatusChange('')}
                  aria-label="Remove status filter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            )}

            {auditorFilter && (
              <span className="filter-chip">
                Auditor: {auditorFilter}
                <button
                  className="filter-chip-remove"
                  onClick={() => onAuditorChange('')}
                  aria-label="Remove auditor filter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            )}

            {dateFilter && (
              <span className="filter-chip">
                Date: {dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
                <button
                  className="filter-chip-remove"
                  onClick={() => onDateChange('')}
                  aria-label="Remove date filter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            )}

            <button className="clear-all-filters-btn" onClick={onClearFilters}>
              Clear All
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}
