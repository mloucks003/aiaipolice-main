import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Radio, MapPin, Clock, LogOut, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = [
  { value: 'Available', label: '10-8 Available', color: 'text-green-500' },
  { value: 'En Route', label: '10-76 En Route', color: 'text-yellow-500' },
  { value: 'On Scene', label: '10-23 On Scene', color: 'text-red-500' },
  { value: 'Out of Service', label: '10-7 Out of Service', color: 'text-gray-500' }
];

export default function MDTInterface({ user, token, onLogout }) {
  const [dispatches, setDispatches] = useState([]);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const ws = useRef(null);

  useEffect(() => {
    fetchData();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('http', 'ws');
      ws.current = new WebSocket(`${wsUrl}/ws/${user.id}`);

      ws.current.onopen = () => {
        console.log('MDT WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'connected') {
            console.log('MDT WebSocket connection confirmed');
          } else if (message.type === 'dispatch_received') {
            setDispatches(prev => [message.data, ...prev]);
            toast.info('New Dispatch Received', {
              description: 'Check your assignments',
              duration: 5000
            });
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('MDT WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('MDT WebSocket disconnected');
      };
    } catch (error) {
      console.error('MDT WebSocket connection failed:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [dispatchesRes, unitsRes] = await Promise.all([
        axios.get(`${API}/dispatches`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/units`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setDispatches(dispatchesRes.data);
      
      if (user.unit_id) {
        const unit = unitsRes.data.find(u => u.id === user.unit_id);
        setCurrentUnit(unit);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!currentUnit) {
      toast.error('No unit assigned');
      return;
    }

    try {
      await axios.patch(
        `${API}/units/${currentUnit.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentUnit(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4" data-testid="mdt-interface">
      {/* Header */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 rounded-lg">
              <Radio className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Mobile Data Terminal</h1>
              <p className="text-sm text-gray-400">{user.username} - {currentUnit?.callsign || 'No Unit'}</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Current Status Card */}
      {currentUnit && (
        <Card className="bg-[#1a1f2e] border-gray-800 mb-4" data-testid="status-card">
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Unit:</span>
                <span className="font-semibold">{currentUnit.callsign}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  currentUnit.status === 'Available' ? 'text-green-500' :
                  currentUnit.status === 'En Route' ? 'text-yellow-500' :
                  currentUnit.status === 'On Scene' ? 'text-red-500' :
                  'text-gray-500'
                }`}>
                  {currentUnit.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`${
                    currentUnit.status === option.value
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  data-testid={`status-${option.value.toLowerCase().replace(' ', '-')}-button`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispatches */}
      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Dispatch Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active dispatches</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="dispatch-list">
              {dispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="bg-[#0f1419] border border-gray-700 rounded-lg p-4"
                  data-testid="dispatch-item"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-sm">Incident #{dispatch.incident_id.slice(-8)}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      dispatch.status === 'Sent' ? 'bg-yellow-900/30 text-yellow-500' :
                      dispatch.status === 'Acknowledged' ? 'bg-blue-900/30 text-blue-500' :
                      'bg-green-900/30 text-green-500'
                    }`}>
                      {dispatch.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{dispatch.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(dispatch.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
