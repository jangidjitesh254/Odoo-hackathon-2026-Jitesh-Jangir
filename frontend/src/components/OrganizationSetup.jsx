import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function OrganizationSetup() {
  const [activeSubTab, setActiveSubTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingCat, setEditingCat] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', head_id: '', parent_id: '', status: 'Active' });
  const [catForm, setCatForm] = useState({ name: '', custom_fields: '{}' });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [deptsData, catsData, usersData] = await Promise.all([
          api.get('/departments'),
          api.get('/categories'),
          api.get('/users'),
        ]);
        setDepartments(deptsData.departments || []);
        setCategories(catsData.categories || []);
        setUsers(usersData.users || []);
      } catch (err) {
        setError(err.message || 'Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingDept) {
        const res = await api.put(`/departments/${editingDept.id}`, deptForm);
        setDepartments(prev => prev.map(d => (d.id === editingDept.id ? { ...d, ...res.department } : d)));
        setSuccess('Department updated successfully');
      } else {
        const res = await api.post('/departments', deptForm);
        setDepartments(prev => [...prev, res.department]);
        setSuccess('Department created successfully');
      }
      setShowDeptModal(false);
      // Reload users to capture any automatic role updates
      const usersData = await api.get('/users');
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || 'Failed to save department');
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    let parsedFields = {};
    try {
      parsedFields = JSON.parse(catForm.custom_fields);
    } catch (err) {
      setError('Invalid custom fields JSON format. Must be a valid JSON object.');
      return;
    }

    try {
      const payload = { name: catForm.name, custom_fields: parsedFields };
      if (editingCat) {
        const res = await api.put(`/categories/${editingCat.id}`, payload);
        setCategories(prev => prev.map(c => (c.id === editingCat.id ? { ...c, ...res.category } : c)));
        setSuccess('Category updated successfully');
      } else {
        const res = await api.post('/categories', payload);
        setCategories(prev => [...prev, res.category]);
        setSuccess('Category created successfully');
      }
      setShowCatModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      setSuccess('User role promoted/updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleUserStatusChange = async (userId, currentStatus) => {
    setError('');
    setSuccess('');
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: newStatus } : u)));
      setSuccess(`User status changed to ${newStatus}`);
    } catch (err) {
      setError(err.message || 'Failed to change user status');
    }
  };

  const openEditDept = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      head_id: dept.head_id || '',
      parent_id: dept.parent_id || '',
      status: dept.status
    });
    setShowDeptModal(true);
  };

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: '', head_id: '', parent_id: '', status: 'Active' });
    setShowDeptModal(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      custom_fields: JSON.stringify(cat.custom_fields, null, 2)
    });
    setShowCatModal(true);
  };

  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', custom_fields: '{\n  "warranty_period_months": 24\n}' });
    setShowCatModal(true);
  };

  if (loading) {
    return <div className="text-muted">Loading system master data...</div>;
  }

  return (
    <div>
      {/* Sub tabs header */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeSubTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('departments')}
        >
          Departments
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('categories')}
        >
          Asset Categories
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('employees')}
        >
          Employee Directory
        </button>
      </div>

      {error && <div className="form-alert form-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="form-alert form-alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Tab A: Departments */}
      {activeSubTab === 'departments' && (
        <div className="section-card">
          <div className="section-header">
            <h3>Department Management</h3>
            <button className="action-btn" onClick={openCreateDept}>+ Add Department</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Department Head</th>
                  <th>Parent Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan="5" className="text-muted text-center">No departments registered.</td></tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.id}>
                      <td className="font-semibold">{dept.name}</td>
                      <td>{dept.head_name || <span className="text-muted">None assigned</span>}</td>
                      <td>{dept.parent_name || <span className="text-muted">Root</span>}</td>
                      <td>
                        <span className={`badge ${dept.status === 'Active' ? 'badge-available' : 'badge-retired'}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <button className="logout-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => openEditDept(dept)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab B: Asset Categories */}
      {activeSubTab === 'categories' && (
        <div className="section-card">
          <div className="section-header">
            <h3>Asset Category Configurations</h3>
            <button className="action-btn" onClick={openCreateCat}>+ Add Category</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Custom Field Schema</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan="3" className="text-muted text-center">No categories registered.</td></tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id}>
                      <td className="font-semibold">{cat.name}</td>
                      <td>
                        <pre style={{ margin: 0, fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                          {JSON.stringify(cat.custom_fields, null, 2)}
                        </pre>
                      </td>
                      <td>
                        <button className="logout-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => openEditCat(cat)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab C: Employee Directory */}
      {activeSubTab === 'employees' && (
        <div className="section-card">
          <div className="section-header">
            <h3>Employee Directory Roles & Status</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                  <th>Toggle Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="6" className="text-muted text-center">No users registered.</td></tr>
                ) : (
                  users.map(emp => (
                    <tr key={emp.id}>
                      <td className="font-semibold">{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department_name || <span className="text-muted">None</span>}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ padding: '0.2rem', width: '150px' }}
                          value={emp.role}
                          onChange={(e) => handleUserRoleChange(emp.id, e.target.value)}
                        >
                          <option value="Employee">Employee</option>
                          <option value="DepartmentHead">Department Head</option>
                          <option value="AssetManager">Asset Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${emp.status === 'Active' ? 'badge-available' : 'badge-lost'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="logout-btn"
                          style={{
                            borderColor: emp.status === 'Active' ? 'var(--danger)' : 'var(--success)',
                            color: emp.status === 'Active' ? 'var(--danger)' : 'var(--success)',
                            background: emp.status === 'Active' ? 'var(--danger-bg)' : 'var(--success-bg)'
                          }}
                          onClick={() => handleUserStatusChange(emp.id, emp.status)}
                        >
                          {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDept ? 'Edit Department' : 'Create Department'}</h3>
              <button className="modal-close-btn" onClick={() => setShowDeptModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleDeptSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assign Department Head (Select from Directory)</label>
                  <select
                    className="form-control"
                    value={deptForm.head_id}
                    onChange={(e) => setDeptForm({ ...deptForm, head_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Parent Department (Hierarchy)</label>
                  <select
                    className="form-control"
                    value={deptForm.parent_id}
                    onChange={(e) => setDeptForm({ ...deptForm, parent_id: e.target.value })}
                  >
                    <option value="">None (Root)</option>
                    {departments.filter(d => !editingDept || d.id !== editingDept.id).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={deptForm.status}
                    onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCat ? 'Edit Category' : 'Create Category'}</h3>
              <button className="modal-close-btn" onClick={() => setShowCatModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCatSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Custom Fields JSON Scheme (e.g. warranty: 24, size: "15inch")</label>
                  <textarea
                    className="form-control"
                    style={{ fontFamily: 'monospace', height: '120px' }}
                    required
                    value={catForm.custom_fields}
                    onChange={(e) => setCatForm({ ...catForm, custom_fields: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="action-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
