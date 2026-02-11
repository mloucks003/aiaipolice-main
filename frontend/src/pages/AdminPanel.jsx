import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, UserPlus, Shield, Database } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPanel({ user, token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [formData, setFormData] = useState({
    badge_number: '',
    username: '',
    password: '',
    full_name: '',
    role: 'officer',
    department: '',
    rank: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setFormData({
        badge_number: '',
        username: '',
        password: '',
        full_name: '',
        role: 'officer',
        department: '',
        rank: ''
      });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}`, 
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const generateSeedData = async () => {
    try {
      await axios.post(`${API}/seed/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Sample data generated successfully');
    } catch (error) {
      toast.error('Failed to generate data');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1d24', padding: '10px' }}>
      <div className="window" style={{ minHeight: 'calc(100vh - 20px)' }}>
        <div className="title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield className="w-4 h-4" />
            <span>System Administration - User Management</span>
          </div>
          <button className="win-button" onClick={onLogout} style={{ padding: '2px 12px' }}>✕</button>
        </div>

        <div className="menu-bar">
          <div className="menu-item">File</div>
          <div className="menu-item">Users</div>
          <div className="menu-item">Reports</div>
          <div className="menu-item">System</div>
        </div>

        <div style={{ padding: '12px', background: '#ece9d8' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 'bold' }}>USER ACCOUNTS</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="win-button" onClick={generateSeedData} data-testid="generate-data-button">
                <Database className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                Generate Test Data
              </button>
              <button className="win-button" onClick={() => setShowAddUser(!showAddUser)} data-testid="add-user-button">
                <UserPlus className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                Add New User
              </button>
            </div>
          </div>

          {showAddUser && (
            <div className="field-group" style={{ marginBottom: '12px' }}>
              <legend>Create New User</legend>
              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Badge Number:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={formData.badge_number}
                    onChange={(e) => setFormData({...formData, badge_number: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Username:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Password:</label>
                  <input
                    type="password"
                    className="win-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Full Name:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Department:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Rank:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={formData.rank}
                    onChange={(e) => setFormData({...formData, rank: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Role:</label>
                  <select
                    className="win-input"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="officer">Officer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  <button type="submit" className="win-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                  <button type="button" className="win-button" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <table className="win-table">
            <thead>
              <tr>
                <th>BADGE #</th>
                <th>USERNAME</th>
                <th>FULL NAME</th>
                <th>RANK</th>
                <th>DEPARTMENT</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="mono-field">{u.badge_number}</td>
                  <td className="mono-field">{u.username}</td>
                  <td>{u.full_name}</td>
                  <td>{u.rank}</td>
                  <td>{u.department}</td>
                  <td>{u.role.toUpperCase()}</td>
                  <td className={u.active ? 'status-active' : 'status-caution'}>
                    {u.active ? 'ACTIVE' : 'INACTIVE'}
                  </td>
                  <td className="mono-field">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="win-button"
                      onClick={() => toggleUserStatus(u.id, u.active)}
                      style={{ padding: '2px 8px' }}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="status-bar">
          <div>Total Users: {users.length}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div className="status-section">Active: {users.filter(u => u.active).length}</div>
            <div className="status-section">Admin: {user.full_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
