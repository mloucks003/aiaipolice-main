import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Phone, MapPin, Clock, User, AlertCircle, Volume2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ActiveCalls({ token, user }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef(null);

  useEffect(() => {
    fetchActiveCalls();
    // Poll for new calls every 5 seconds
    const interval = setInterval(fetchActiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  const playAlarmSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    
    // Play 2 loud alert beeps to get attention
    const playBeep = (delay) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;  // High pitched alert tone
        oscillator.type = 'square';  // More attention-grabbing than sine
        
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);  // Louder (60%)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, delay);
    };

    // Play only 2 short loud beeps
    playBeep(0);      // First beep
    playBeep(300);    // Second beep
  };

  const playDispatchAudio = (audioUrl) => {
    if (!soundEnabled || !audioUrl) {
      console.log('Dispatch audio not playing:', { soundEnabled, audioUrl });
      return;
    }
    
    console.log('Playing dispatch audio:', audioUrl);
    
    // Play dispatch audio after beeps - SIMPLIFIED (no complex effects for now)
    setTimeout(() => {
      const audio = new Audio(audioUrl);
      audio.volume = 0.95;
      
      audio.onloadeddata = () => console.log('✓ Dispatch audio loaded');
      audio.onplay = () => console.log('✓ Dispatch audio PLAYING');
      audio.onended = () => console.log('✓ Dispatch audio finished');
      audio.onerror = (e) => console.error('✗ Dispatch audio ERROR:', e);
      
      audio.play()
        .then(() => console.log('✓ audio.play() promise resolved'))
        .catch(err => console.error('✗ audio.play() FAILED:', err.message));
    }, 600);
  };

  const fetchActiveCalls = async () => {
    try {
      const response = await axios.get(`${API}/calls/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check for NEW Active calls for alarm
      const newActiveCalls = response.data.filter(call => 
        call.status === 'Active' && 
        !calls.find(c => c.id === call.id && c.status === 'Active')
      );
      
      if (newActiveCalls.length > 0 && soundEnabled) {
        console.log('NEW ACTIVE CALL:', newActiveCalls.length);
        
        // Play alarm beeps
        playAlarmSound();
        
        // Play dispatch audio
        newActiveCalls.forEach(call => {
          if (call.dispatch_audio_url) {
            playDispatchAudio(call.dispatch_audio_url);
          }
          
          toast.error(`🚨 NEW CALL`, {
            description: `${call.incident_type || 'Emergency'} - ${call.location || 'Location pending'}`,
            duration: 10000
          });
        });
      }
      
      // Show ALL calls (Active, Processing, Dispatched)
      setCalls(response.data);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    }
  };

  const handleAttach = async (callId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/calls/${callId}/attach`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('You are now responding to this call');
      fetchActiveCalls();
    } catch (error) {
      toast.error('Failed to attach to call');
    } finally {
      setLoading(false);
    }
  };

  const handleOnScene = async (callId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/calls/${callId}/on-scene`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Marked as on scene - caller will be notified');
      fetchActiveCalls();
    } catch (error) {
      toast.error('Failed to mark on scene');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (callId) => {
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

  const handleClearAllCalls = async () => {
    if (!window.confirm('Clear ALL calls? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      // Close all active calls
      for (const call of calls) {
        await axios.post(`${API}/calls/${call.id}/close`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success('All calls cleared');
      fetchActiveCalls();
    } catch (error) {
      toast.error('Failed to clear calls');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    if (priority === 1) return 'badge badge-critical';
    if (priority === 2) return 'badge badge-high';
    if (priority === 3) return 'badge badge-medium';
    return 'badge badge-success';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'CRITICAL',
      2: 'HIGH',
      3: 'MEDIUM',
      4: 'LOW',
      5: 'INFO'
    };
    return labels[priority] || 'MEDIUM';
  };

  if (calls.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <AlertCircle className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
        <p style={{ fontSize: '11px', opacity: 0.7 }}>NO ACTIVE EMERGENCY CALLS</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
          ACTIVE EMERGENCY CALLS: {calls.length}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="win-button btn-primary"
            onClick={() => {
              // TEST BUTTON - Play most recent dispatch audio
              const callWithAudio = calls.find(c => c.dispatch_audio_url);
              if (callWithAudio) {
                console.log('TEST: Playing dispatch audio:', callWithAudio.dispatch_audio_url);
                const audio = new Audio(callWithAudio.dispatch_audio_url);
                audio.volume = 0.95;
                audio.play()
                  .then(() => console.log('TEST: Audio playing'))
                  .catch(err => console.error('TEST: Failed:', err));
              } else {
                console.log('TEST: No calls with dispatch_audio_url');
              }
            }}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            🔊 TEST AUDIO
          </button>
          <button
            className="win-button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}
            title={soundEnabled ? 'Alarm Enabled' : 'Alarm Disabled'}
          >
            <Volume2 className="w-3 h-3" style={{ color: soundEnabled ? '#10b981' : '#ef4444' }} />
            {soundEnabled ? 'ALARM ON' : 'ALARM OFF'}
          </button>
          {calls.length > 0 && (
            <button 
              className="win-button btn-danger"
              onClick={handleClearAllCalls}
              disabled={loading}
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              🗑️ CLEAR ALL
            </button>
          )}
        </div>
      </div>
      
      <div style={{ maxHeight: '600px', overflow: 'auto' }}>
        {calls.map(call => (
          <div
            key={call.id}
            className="field-group"
            style={{ 
              marginBottom: '12px',
              borderColor: call.priority <= 2 ? '#dc2626' : undefined,
              boxShadow: call.priority <= 2 ? '0 0 15px rgba(220, 38, 38, 0.3)' : undefined
            }}
          >
            <legend className={getPriorityClass(call.priority)}>
              CALL #{call.call_sid.slice(-6)} - {getPriorityLabel(call.priority)}
            </legend>
            
            <div style={{ padding: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <Phone className="w-4 h-4" />
                  <span className="mono-field">{call.caller_phone}</span>
                </div>
                
                {call.incident_type && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <AlertCircle className="w-4 h-4" />
                    <span style={{ fontWeight: 'bold' }}>{call.incident_type.toUpperCase()}</span>
                  </div>
                )}
                
                {call.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <MapPin className="w-4 h-4" />
                    <span>{call.location}</span>
                  </div>
                )}
                
                {call.description && (
                  <div style={{ fontSize: '11px', marginTop: '4px', padding: '8px', background: '#0d1117', border: '1px solid #2d3748', borderRadius: '4px', color: '#d1d5db' }}>
                    {call.description}
                  </div>
                )}
                
                {call.assigned_officer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <User className="w-4 h-4" />
                    <span className="badge badge-info">RESPONDING: Badge #{call.assigned_officer}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', opacity: 0.7 }}>
                  <Clock className="w-3 h-3" />
                  <span className="mono-field">{new Date(call.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2d3748' }}>
                {call.status === 'Active' && !call.assigned_officer && (
                  <button
                    className="win-button btn-primary"
                    onClick={() => handleAttach(call.id)}
                    disabled={loading}
                    style={{ flex: 1 }}
                    data-testid={`attach-call-${call.id}`}
                  >
                    RESPOND TO CALL
                  </button>
                )}
                
                {call.assigned_officer === user.badge_number && !call.officer_on_scene && (
                  <>
                    <button
                      className="win-button"
                      onClick={() => handleOnScene(call.id)}
                      disabled={loading}
                      style={{ flex: 1, background: '#f59e0b', borderColor: '#d97706' }}
                      data-testid={`on-scene-${call.id}`}
                    >
                      ARRIVED ON SCENE
                    </button>
                    <button
                      className="win-button btn-success"
                      onClick={() => handleClose(call.id)}
                      disabled={loading}
                      style={{ flex: 1 }}
                      data-testid={`close-call-${call.id}`}
                    >
                      MARK COMPLETE
                    </button>
                  </>
                )}
                
                {call.assigned_officer === user.badge_number && call.officer_on_scene && (
                  <button
                    className="win-button btn-success"
                    onClick={() => handleClose(call.id)}
                    disabled={loading}
                    style={{ flex: 1 }}
                    data-testid={`close-call-${call.id}`}
                  >
                    MARK COMPLETE
                  </button>
                )}
                
                {call.status === 'Dispatched' && call.assigned_officer !== user.badge_number && (
                  <div style={{ flex: 1, fontSize: '11px', textAlign: 'center', padding: '8px' }} className="badge badge-info">
                    UNIT RESPONDING
                  </div>
                )}
                
                {call.status === 'On Scene' && call.assigned_officer !== user.badge_number && (
                  <div style={{ flex: 1, fontSize: '11px', textAlign: 'center', padding: '8px' }} className="badge badge-success">
                    UNIT ON SCENE
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
