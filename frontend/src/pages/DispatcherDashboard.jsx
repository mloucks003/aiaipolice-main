import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Phone, MapPin, Clock, User, AlertCircle, LogOut, RefreshCw, 
  Plus, Send, MessageSquare, Radio, Shield, Truck, Activity,
  ChevronDown, ChevronUp, X, Edit2, Save, History, Siren
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const DISPOSITION_CODES = [
  'Report Taken', 'Arrest Made', 'Citation Issued', 'Warning Given',
  'Gone on Arrival', 'Unfounded', 'Civil Matter', 'Referred to Other Agency',
  'No Action Required', 'Unable to Locate', 'Cancelled', 'Other'
];

const INCIDENT_TYPES = [
  'Domestic Disturbance', 'Traffic Accident', 'Robbery', 'Assault', 'Burglary',
  'Suspicious Activity', 'Noise Complaint', 'Medical Emergency', 'Fire',
  'Traffic Stop', 'Welfare Check', 'Theft', 'Vandalism', 'Trespassing', 'Other'
];

const STATUS_COLORS = {
  'Available': '#10b981',
  'En Route': '#f59e0b',
  'On Scene': '#ef4444',
  'Out of Service': '#6b7280'
};

const TYPE_ICONS = { 'Police': '👮', 'Fire': '🚒', 'EMS': '🚑' };

export default function DispatcherDashboard({ user, token, onLogout }) {
  const [calls, setCalls] = useState([]);
  const [units, setUnits] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calls'); // calls, units, history
  const [showDispatchModal, setShowDispatchModal] = useState(null); // call object or null
  const [showNotes, setShowNotes] = useState(null); // call id or null
  const [showCloseModal, setShowCloseModal] = useState(null); // call object or null
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [showCreateCall, setShowCreateCall] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [newUnit, setNewUnit] = useState({ callsign: '', type: 'Police' });
  const [disposition, setDisposition] = useState('');
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [callForm, setCallForm] = useState({
    incident_type: 'Other', location: '', description: '', caller_phone: '', priority: 3
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [callsRes, unitsRes] = await Promise.all([
        axios.get(`${API}/calls/active`, { headers }),
        axios.get(`${API}/units`, { headers })
      ]);
      setCalls(callsRes.data);
      setUnits(unitsRes.data);
    } catch (e) { console.error('Fetch error:', e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/calls/history`, { headers });
      setCallHistory(res.data);
    } catch (e) { console.error('History fetch error:', e); }
  };

  const fetchNotes = async (callId) => {
    try {
      const res = await axios.get(`${API}/calls/${callId}/notes`, { headers });
      setNotes(res.data || []);
    } catch (e) { setNotes([]); }
  };

  const addNote = async (callId) => {
    if (!newNote.trim()) return;
    try {
      await axios.post(`${API}/calls/${callId}/notes`, { text: newNote }, { headers });
      setNewNote('');
      fetchNotes(callId);
    } catch (e) { toast.error('Failed to add note'); }
  };

  const handleCloseCall = async (callId) => {
    try {
      await axios.post(`${API}/calls/${callId}/close-with-disposition`, 
        { disposition, disposition_notes: dispositionNotes }, { headers });
      toast.success('Call closed');
      setShowCloseModal(null);
      setDisposition('');
      setDispositionNotes('');
      fetchAll();
    } catch (e) { toast.error('Failed to close call'); }
  };

  const handleUpdateCall = async (callId, data) => {
    try {
      await axios.put(`${API}/calls/${callId}`, data, { headers });
      toast.success('Call updated');
      setEditingCall(null);
      fetchAll();
    } catch (e) { toast.error('Failed to update call'); }
  };

  const handleDispatch = async (callId, unitIds) => {
    try {
      await axios.post(`${API}/dispatch`, { call_id: callId, unit_ids: unitIds }, { headers });
      toast.success('Units dispatched');
      setShowDispatchModal(null);
      fetchAll();
    } catch (e) { toast.error('Failed to dispatch'); }
  };

  const handleCreateUnit = async () => {
    if (!newUnit.callsign.trim()) return;
    try {
      await axios.post(`${API}/units`, newUnit, { headers });
      toast.success('Unit created');
      setNewUnit({ callsign: '', type: 'Police' });
      setShowCreateUnit(false);
      fetchAll();
    } catch (e) { toast.error('Failed to create unit'); }
  };

  const handleUpdateUnitStatus = async (unitId, status) => {
    try {
      await axios.put(`${API}/units/${unitId}/status`, { status }, { headers });
      fetchAll();
    } catch (e) { toast.error('Failed to update unit'); }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await axios.delete(`${API}/units/${unitId}`, { headers });
      toast.success('Unit deleted');
      fetchAll();
    } catch (e) { toast.error('Failed to delete unit'); }
  };

  const handleSeedUnits = async () => {
    try {
      const res = await axios.post(`${API}/units/seed`, {}, { headers });
      toast.success(res.data.message);
      fetchAll();
    } catch (e) { toast.error('Failed to seed units'); }
  };

  const handleCreateCall = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/calls/create`, callForm, { headers });
      toast.success('Call created');
      setCallForm({ incident_type: 'Other', location: '', description: '', caller_phone: '', priority: 3 });
      setShowCreateCall(false);
      fetchAll();
    } catch (e) { toast.error('Failed to create call'); }
  };

  const getPriorityStyle = (p) => {
    const styles = {
      1: { bg: '#7f1d1d', border: '#dc2626', text: '#fca5a5', label: 'CRITICAL' },
      2: { bg: '#7c2d12', border: '#ea580c', text: '#fdba74', label: 'HIGH' },
      3: { bg: '#713f12', border: '#ca8a04', text: '#fde047', label: 'MEDIUM' },
      4: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd', label: 'LOW' },
      5: { bg: '#1f2937', border: '#6b7280', text: '#d1d5db', label: 'INFO' }
    };
    return styles[p] || styles[3];
  };

  const availableUnits = units.filter(u => u.status === 'Available');
  const activeCallCount = calls.filter(c => c.status !== 'Closed').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e5e7eb', fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div style={{ background: '#111827', padding: '10px 20px', borderBottom: '2px solid #1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Siren className="w-5 h-5" style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>DISPATCH CONSOLE</span>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>{user?.full_name || user?.username}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#10b981', marginRight: '12px' }}>
            ● {activeCallCount} ACTIVE | {availableUnits.length} UNITS AVAIL
          </div>
          <button className="win-button" onClick={fetchAll} style={{ padding: '4px 10px', fontSize: '11px' }}>
            <RefreshCw className="w-3 h-3" /> REFRESH
          </button>
          <button className="win-button btn-danger" onClick={onLogout} style={{ padding: '4px 10px', fontSize: '11px' }}>
            <LogOut className="w-3 h-3" /> LOGOUT
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: '#0f172a', padding: '0 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '0' }}>
        {[
          { id: 'calls', label: `CALLS (${activeCallCount})`, icon: <Phone className="w-3 h-3" /> },
          { id: 'units', label: `UNITS (${units.length})`, icon: <Radio className="w-3 h-3" /> },
          { id: 'history', label: 'HISTORY', icon: <History className="w-3 h-3" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'history') fetchHistory(); }}
            style={{
              padding: '10px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
              background: activeTab === tab.id ? '#1e293b' : 'transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#6b7280',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>
        {/* Left: Main Panel */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>

          {/* ===== CALLS TAB ===== */}
          {activeTab === 'calls' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>ACTIVE CALLS</span>
                <button className="win-button btn-primary" onClick={() => setShowCreateCall(!showCreateCall)} style={{ padding: '4px 12px', fontSize: '11px' }}>
                  + NEW CALL
                </button>
              </div>

              {/* Create Call Form */}
              {showCreateCall && (
                <div style={{ background: '#111827', border: '1px solid #1e3a5f', padding: '12px', marginBottom: '12px', borderRadius: '4px' }}>
                  <form onSubmit={handleCreateCall} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>TYPE</label>
                      <select className="win-input" value={callForm.incident_type} onChange={e => setCallForm({...callForm, incident_type: e.target.value})} style={{ width: '100%' }}>
                        {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>PRIORITY</label>
                      <select className="win-input" value={callForm.priority} onChange={e => setCallForm({...callForm, priority: parseInt(e.target.value)})} style={{ width: '100%' }}>
                        {[1,2,3,4,5].map(p => <option key={p} value={p}>{p} - {getPriorityStyle(p).label}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>LOCATION</label>
                      <input className="win-input" value={callForm.location} onChange={e => setCallForm({...callForm, location: e.target.value})} style={{ width: '100%' }} placeholder="Address" required />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>CALLER</label>
                      <input className="win-input" value={callForm.caller_phone} onChange={e => setCallForm({...callForm, caller_phone: e.target.value})} style={{ width: '100%' }} placeholder="Phone" />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>DESCRIPTION</label>
                      <input className="win-input" value={callForm.description} onChange={e => setCallForm({...callForm, description: e.target.value})} style={{ width: '100%' }} placeholder="Details" />
                    </div>
                    <div style={{ gridColumn: '1/-1', display: 'flex', gap: '8px' }}>
                      <button type="submit" className="win-button btn-primary" style={{ fontSize: '11px' }}>CREATE</button>
                      <button type="button" className="win-button" onClick={() => setShowCreateCall(false)} style={{ fontSize: '11px' }}>CANCEL</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Call Cards */}
              {calls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>NO ACTIVE CALLS</div>
              ) : (
                calls.map(call => {
                  const ps = getPriorityStyle(call.priority);
                  const assignedUnits = units.filter(u => u.assigned_call_id === call.id);
                  const isEditing = editingCall === call.id;
                  return (
                    <div key={call.id} style={{ background: '#111827', border: `1px solid ${ps.border}`, marginBottom: '10px', borderRadius: '4px', boxShadow: call.priority <= 2 ? `0 0 12px ${ps.border}40` : 'none' }}>
                      {/* Call Header */}
                      <div style={{ padding: '8px 12px', background: `${ps.bg}80`, borderBottom: `1px solid ${ps.border}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', background: ps.bg, color: ps.text, border: `1px solid ${ps.border}`, borderRadius: '2px', fontWeight: 'bold' }}>
                            P{call.priority} {ps.label}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{call.incident_type || 'UNKNOWN'}</span>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>#{call.call_sid?.slice(-6)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', background: '#1e293b', borderRadius: '2px', color: call.status === 'Active' ? '#10b981' : call.status === 'Dispatched' ? '#f59e0b' : '#3b82f6' }}>
                            {call.status}
                          </span>
                        </div>
                      </div>

                      {/* Call Body */}
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin className="w-3 h-3" style={{ color: '#6b7280' }} />
                            {isEditing ? (
                              <input className="win-input" defaultValue={call.location} id={`loc-${call.id}`} style={{ width: '100%', fontSize: '11px' }} />
                            ) : (
                              <span>{call.location || 'Unknown'}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone className="w-3 h-3" style={{ color: '#6b7280' }} />
                            <span className="mono-field">{call.caller_phone}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock className="w-3 h-3" style={{ color: '#6b7280' }} />
                            <span>{new Date(call.created_at).toLocaleTimeString()}</span>
                          </div>
                          {call.assigned_officer && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User className="w-3 h-3" style={{ color: '#6b7280' }} />
                              <span>Badge #{call.assigned_officer}</span>
                            </div>
                          )}
                        </div>

                        {call.description && (
                          <div style={{ fontSize: '11px', marginTop: '8px', padding: '6px 8px', background: '#0d1117', border: '1px solid #1e293b', borderRadius: '2px', color: '#d1d5db' }}>
                            {call.description}
                          </div>
                        )}

                        {/* Assigned Units */}
                        {assignedUnits.length > 0 && (
                          <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {assignedUnits.map(u => (
                              <span key={u.id} style={{ fontSize: '10px', padding: '2px 6px', background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: '2px', color: '#93c5fd' }}>
                                {TYPE_ICONS[u.type]} {u.callsign} - {u.status}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e293b', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button className="win-button btn-primary" onClick={() => setShowDispatchModal(call)} style={{ fontSize: '10px', padding: '3px 8px' }}>
                            <Send className="w-3 h-3" /> DISPATCH
                          </button>
                          <button className="win-button" onClick={() => { setShowNotes(call.id); fetchNotes(call.id); }} style={{ fontSize: '10px', padding: '3px 8px' }}>
                            <MessageSquare className="w-3 h-3" /> NOTES
                          </button>
                          {isEditing ? (
                            <button className="win-button btn-primary" onClick={() => {
                              const loc = document.getElementById(`loc-${call.id}`)?.value;
                              handleUpdateCall(call.id, { location: loc });
                            }} style={{ fontSize: '10px', padding: '3px 8px' }}>
                              <Save className="w-3 h-3" /> SAVE
                            </button>
                          ) : (
                            <button className="win-button" onClick={() => setEditingCall(call.id)} style={{ fontSize: '10px', padding: '3px 8px' }}>
                              <Edit2 className="w-3 h-3" /> EDIT
                            </button>
                          )}
                          <button className="win-button btn-danger" onClick={() => setShowCloseModal(call)} style={{ fontSize: '10px', padding: '3px 8px' }}>
                            <X className="w-3 h-3" /> CLOSE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ===== UNITS TAB ===== */}
          {activeTab === 'units' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>UNIT MANAGEMENT</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="win-button btn-primary" onClick={() => setShowCreateUnit(!showCreateUnit)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    + ADD UNIT
                  </button>
                  <button className="win-button" onClick={handleSeedUnits} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    SEED DEFAULTS
                  </button>
                </div>
              </div>

              {showCreateUnit && (
                <div style={{ background: '#111827', border: '1px solid #1e3a5f', padding: '12px', marginBottom: '12px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>CALLSIGN</label>
                    <input className="win-input" value={newUnit.callsign} onChange={e => setNewUnit({...newUnit, callsign: e.target.value})} placeholder="ADAM-12" />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px', color: '#9ca3af' }}>TYPE</label>
                    <select className="win-input" value={newUnit.type} onChange={e => setNewUnit({...newUnit, type: e.target.value})}>
                      <option value="Police">Police</option>
                      <option value="Fire">Fire</option>
                      <option value="EMS">EMS</option>
                    </select>
                  </div>
                  <button className="win-button btn-primary" onClick={handleCreateUnit} style={{ fontSize: '11px' }}>CREATE</button>
                  <button className="win-button" onClick={() => setShowCreateUnit(false)} style={{ fontSize: '11px' }}>CANCEL</button>
                </div>
              )}

              {units.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>NO UNITS CONFIGURED</p>
                  <button className="win-button btn-primary" onClick={handleSeedUnits} style={{ marginTop: '12px' }}>SEED DEFAULT UNITS</button>
                </div>
              ) : (
                <div>
                  {['Police', 'Fire', 'EMS'].map(type => {
                    const typeUnits = units.filter(u => u.type === type);
                    if (typeUnits.length === 0) return null;
                    return (
                      <div key={type} style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
                          {TYPE_ICONS[type]} {type.toUpperCase()} ({typeUnits.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                          {typeUnits.map(unit => (
                            <div key={unit.id} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px', borderLeft: `3px solid ${STATUS_COLORS[unit.status] || '#6b7280'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{unit.callsign}</span>
                                <span style={{ fontSize: '10px', color: STATUS_COLORS[unit.status], fontWeight: 'bold' }}>● {unit.status}</span>
                              </div>
                              {unit.assigned_officer_name && (
                                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                                  <User className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                                  {unit.assigned_officer_name}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                {['Available', 'En Route', 'On Scene', 'Out of Service'].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => handleUpdateUnitStatus(unit.id, s)}
                                    disabled={unit.status === s}
                                    style={{
                                      fontSize: '9px', padding: '2px 5px', cursor: 'pointer',
                                      background: unit.status === s ? STATUS_COLORS[s] + '30' : '#0f172a',
                                      color: unit.status === s ? STATUS_COLORS[s] : '#6b7280',
                                      border: `1px solid ${unit.status === s ? STATUS_COLORS[s] : '#374151'}`,
                                      borderRadius: '2px', fontFamily: 'inherit'
                                    }}
                                  >
                                    {s === 'Out of Service' ? 'OOS' : s.toUpperCase()}
                                  </button>
                                ))}
                                <button onClick={() => handleDeleteUnit(unit.id)} style={{ fontSize: '9px', padding: '2px 5px', background: '#0f172a', color: '#ef4444', border: '1px solid #374151', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                  DEL
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== HISTORY TAB ===== */}
          {activeTab === 'history' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>CALL HISTORY</div>
              {callHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>NO CLOSED CALLS</div>
              ) : (
                callHistory.map(call => {
                  const ps = getPriorityStyle(call.priority);
                  return (
                    <div key={call.id} style={{ background: '#111827', border: '1px solid #1e293b', marginBottom: '8px', borderRadius: '4px', padding: '10px', opacity: 0.8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: ps.bg, color: ps.text, border: `1px solid ${ps.border}`, borderRadius: '2px' }}>P{call.priority}</span>
                          <span style={{ fontWeight: 'bold' }}>{call.incident_type}</span>
                        </div>
                        <span style={{ color: '#6b7280' }}>{new Date(call.closed_at || call.updated_at).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {call.location && <span><MapPin className="w-3 h-3" style={{ display: 'inline' }} /> {call.location}</span>}
                        {call.disposition && <span style={{ marginLeft: '12px', color: '#60a5fa' }}>DISP: {call.disposition}</span>}
                      </div>
                      {call.description && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{call.description}</div>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Unit Status Quick View (always visible) */}
        <div style={{ width: '240px', background: '#0f172a', borderLeft: '1px solid #1e293b', padding: '12px', overflow: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '10px' }}>UNIT STATUS</div>
          {units.length === 0 ? (
            <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>No units</div>
          ) : (
            units.map(unit => (
              <div key={unit.id} style={{ padding: '6px 8px', marginBottom: '4px', background: '#111827', borderRadius: '3px', borderLeft: `2px solid ${STATUS_COLORS[unit.status]}`, fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{TYPE_ICONS[unit.type]} {unit.callsign}</span>
                  <span style={{ fontSize: '9px', color: STATUS_COLORS[unit.status] }}>{unit.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== DISPATCH MODAL ===== */}
      {showDispatchModal && <DispatchModalInline
        call={showDispatchModal}
        units={availableUnits}
        onDispatch={handleDispatch}
        onClose={() => setShowDispatchModal(null)}
      />}

      {/* ===== NOTES MODAL ===== */}
      {showNotes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1a1f2e', border: '1px solid #374151', borderRadius: '6px', padding: '20px', width: '500px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>CALL NOTES</span>
              <button onClick={() => setShowNotes(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', marginBottom: '12px' }}>
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>No notes yet</div>
              ) : (
                notes.map(n => (
                  <div key={n.id} style={{ padding: '8px', marginBottom: '6px', background: '#0f172a', borderRadius: '4px', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>
                      <span>{n.author} {n.badge !== 'DISPATCH' ? `(#${n.badge})` : ''}</span>
                      <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '12px' }}>{n.text}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                className="win-input"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add note..."
                style={{ flex: 1 }}
                onKeyDown={e => { if (e.key === 'Enter') addNote(showNotes); }}
              />
              <button className="win-button btn-primary" onClick={() => addNote(showNotes)} style={{ fontSize: '11px' }}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CLOSE WITH DISPOSITION MODAL ===== */}
      {showCloseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1a1f2e', border: '1px solid #374151', borderRadius: '6px', padding: '20px', width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>CLOSE CALL</span>
              <button onClick={() => setShowCloseModal(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: '#9ca3af' }}>DISPOSITION CODE</label>
              <select className="win-input" value={disposition} onChange={e => setDisposition(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select --</option>
                {DISPOSITION_CODES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: '#9ca3af' }}>NOTES</label>
              <textarea className="win-input" value={dispositionNotes} onChange={e => setDispositionNotes(e.target.value)} style={{ width: '100%', minHeight: '60px', resize: 'vertical' }} placeholder="Closing notes..." />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="win-button btn-danger" onClick={() => handleCloseCall(showCloseModal.id)} style={{ flex: 1, fontSize: '12px' }}>CLOSE CALL</button>
              <button className="win-button" onClick={() => setShowCloseModal(null)} style={{ flex: 1, fontSize: '12px' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline Dispatch Modal */
function DispatchModalInline({ call, units, onDispatch, onClose }) {
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const ps = {
    1: { color: '#fca5a5', bg: '#7f1d1d' },
    2: { color: '#fdba74', bg: '#7c2d12' },
    3: { color: '#fde047', bg: '#713f12' },
    4: { color: '#93c5fd', bg: '#1e3a5f' },
    5: { color: '#d1d5db', bg: '#1f2937' }
  }[call.priority] || { color: '#fde047', bg: '#713f12' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#1a1f2e', border: '1px solid #374151', borderRadius: '6px', padding: '20px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>DISPATCH UNITS</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
        </div>

        <div style={{ padding: '10px', background: ps.bg, border: '1px solid #374151', borderRadius: '4px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: ps.color }}>{call.incident_type} - P{call.priority}</div>
          <div style={{ fontSize: '11px', color: '#d1d5db', marginTop: '4px' }}><MapPin className="w-3 h-3" style={{ display: 'inline' }} /> {call.location}</div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>AVAILABLE UNITS ({units.length})</div>
        {units.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>No available units</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            {units.map(u => (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                style={{
                  padding: '8px', borderRadius: '4px', cursor: 'pointer',
                  background: selected.includes(u.id) ? '#1e3a5f' : '#0f172a',
                  border: `1px solid ${selected.includes(u.id) ? '#3b82f6' : '#374151'}`,
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{TYPE_ICONS[u.type]} {u.callsign}</div>
                {u.assigned_officer_name && <div style={{ fontSize: '10px', color: '#6b7280' }}>{u.assigned_officer_name}</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="win-button btn-primary"
            disabled={selected.length === 0}
            onClick={() => onDispatch(call.id, selected)}
            style={{ flex: 1, fontSize: '12px' }}
          >
            <Send className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            DISPATCH {selected.length} UNIT(S)
          </button>
          <button className="win-button" onClick={onClose} style={{ flex: 1, fontSize: '12px' }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
