import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Phone, MapPin, Clock, User, AlertCircle, LogOut, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DispatcherDashboard({ user, token, onLogout }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveCalls = async () => {
    try {
      const response = await axios.get(`${API}/calls/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data);
    } catch (error) {
      console.error('Failed to fetch calls');
    }
  };

  const handleCloseCall = async (callId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/calls/${callId}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Call closed');
      fetchActiveCalls();
    } catch (error) {
      toast.error('Failed to close call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e27', color: '#e5e7eb' }}>
      <div style={{ 
        background: '#1a1f3a', 
        padding: '16px 24px', 
        borderBottom: '2px solid #2d3748',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: 0, fontFamily: 'Courier New', color: '#10b981' }}>
            📡 DISPATCH CONSOLE
          </h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
            {user?.full_name || user?.username}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="win-button" onClick={fetchActiveCalls}>
            <RefreshCw className="w-4 h-4" /> REFRESH
          </button>
          <button className="win-button btn-danger" onClick={onLogout}>
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>ACTIVE CALLS: {calls.length}</h2>

        {calls.length === 0 ? (
          <div className="field-group" style={{ textAlign: 'center', padding: '40px' }}>
            <p>NO ACTIVE CALLS</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {calls.map(call => (
              <div key={call.id} className="field-group">
                <legend>
                  <span className={call.priority <= 2 ? 'badge badge-critical' : 'badge badge-medium'}>
                    PRIORITY {call.priority}
                  </span>
                  <span className="badge badge-info">{call.status}</span>
                </legend>
                
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <Phone className="w-4 h-4" style={{ display: 'inline', marginRight: '6px' }} />
                        <span className="mono-field">{call.caller_phone}</span>
                      </div>
                      {call.incident_type && (
                        <div style={{ marginBottom: '8px' }}>
                          <AlertCircle className="w-4 h-4" style={{ display: 'inline', marginRight: '6px' }} />
                          <strong>{call.incident_type}</strong>
                        </div>
                      )}
                      {call.location && (
                        <div>
                          <MapPin className="w-4 h-4" style={{ display: 'inline', marginRight: '6px' }} />
                          {call.location}
                        </div>
                      )}
                    </div>
                    <div>
                      {call.assigned_officer && (
                        <div style={{ marginBottom: '8px' }}>
                          <User className="w-4 h-4" style={{ display: 'inline', marginRight: '6px' }} />
                          {call.assigned_officer_name || call.assigned_officer}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        <Clock className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(call.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {call.description && (
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '12px', 
                      padding: '12px', 
                      background: '#0d1117', 
                      border: '1px solid #2d3748'
                    }}>
                      {call.description}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2d3748' }}>
                    <button
                      className="win-button btn-danger"
                      onClick={() => handleCloseCall(call.id)}
                      disabled={loading}
                    >
                      CLOSE CALL
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
