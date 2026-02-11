import { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      toast.success('Authentication successful');
      onLogin(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#1a1d24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="window" style={{ width: '450px', margin: '20px' }}>
        <div className="title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield className="w-4 h-4" />
            <span>Law Enforcement Records Management System - Login</span>
          </div>
        </div>
        
        <div style={{ padding: '20px', background: '#ece9d8' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #808080', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>RESTRICTED ACCESS</h2>
            <p style={{ fontSize: '11px', color: '#800000' }}>Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>USERNAME:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="win-input"
                style={{ width: '100%', textTransform: 'uppercase' }}
                data-testid="username-input"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>PASSWORD:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="win-input"
                style={{ width: '100%' }}
                data-testid="password-input"
                placeholder="Enter password"
              />
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                className="win-button"
                disabled={loading}
                data-testid="login-button"
                style={{ width: '120px', padding: '6px 12px' }}
              >
                {loading ? 'VERIFYING...' : 'LOGIN'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '20px', padding: '10px', background: '#ffffff', border: '2px solid #808080', borderStyle: 'inset' }}>
            <p style={{ fontSize: '10px', color: '#000', lineHeight: '1.4' }}>
              <strong>WARNING:</strong> This is a restricted law enforcement system. Unauthorized access is prohibited and may result in criminal prosecution.
            </p>
          </div>

          <div style={{ marginTop: '12px', padding: '8px', background: '#ffffe0', border: '1px solid #808080' }}>
            <p style={{ fontSize: '10px', color: '#000' }}>
              <strong>System Info:</strong> Contact administrator for access credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
