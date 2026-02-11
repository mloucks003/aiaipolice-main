import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, Sparkles, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INCIDENT_TYPES = [
  'Traffic Accident',
  'Theft',
  'Burglary',
  'Assault',
  'Domestic Violence',
  'DUI',
  'Suspicious Activity',
  'Disturbance',
  'Vandalism',
  'Other'
];

export default function ReportWriter({ token, user }) {
  const [formData, setFormData] = useState({
    incident_type: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    location: '',
    narrative: '',
    details: ''
  });
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAIGenerate = async () => {
    if (!formData.incident_type || !formData.location || !formData.details) {
      toast.error('Please fill in incident type, location, and basic details');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(`${API}/ai/generate-report`, 
        {
          incident_type: formData.incident_type,
          date_time: `${formData.incident_date} ${formData.incident_time}`,
          location: formData.location,
          details: formData.details
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({...formData, narrative: response.data.narrative});
      toast.success('AI-generated report ready');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/reports`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Report submitted successfully');
      setFormData({
        incident_type: '',
        incident_date: new Date().toISOString().split('T')[0],
        incident_time: new Date().toTimeString().slice(0, 5),
        location: '',
        narrative: '',
        details: ''
      });
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '12px', padding: '8px', background: '#ffffe0', border: '2px solid #808080' }}>
        <p style={{ fontSize: '11px', margin: 0 }}>
          <strong>AI ASSISTANT:</strong> Fill in the basic details below, then click "Generate with AI" to create a professional report narrative automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>INCIDENT INFORMATION</legend>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>INCIDENT TYPE:</label>
              <select
                className="win-input"
                value={formData.incident_type}
                onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
                required
                style={{ width: '100%' }}
              >
                <option value="">-- SELECT TYPE --</option>
                {INCIDENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>LOCATION:</label>
              <input
                type="text"
                className="win-input"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
                style={{ width: '100%' }}
                placeholder="ADDRESS OR INTERSECTION"
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DATE:</label>
              <input
                type="date"
                className="win-input"
                value={formData.incident_date}
                onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>TIME:</label>
              <input
                type="time"
                className="win-input"
                value={formData.incident_time}
                onChange={(e) => setFormData({...formData, incident_time: e.target.value})}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>BRIEF DETAILS (FOR AI)</legend>
          <div style={{ padding: '12px' }}>
            <textarea
              className="win-input"
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              style={{ width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
              placeholder="Enter brief details: who, what, when, where, how... (e.g., 'Male suspect broke window of parked vehicle and stole laptop. Witness observed and called 911. Suspect fled on foot northbound.')"            />
            <button
              type="button"
              className="win-button"
              onClick={handleAIGenerate}
              disabled={generating}
              style={{ marginTop: '8px' }}
            >
              <Sparkles className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
              {generating ? 'GENERATING...' : 'GENERATE WITH AI'}
            </button>
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>REPORT NARRATIVE</legend>
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '11px', color: '#000080' }}>
              <strong>REPORTING OFFICER:</strong> {user.full_name} (Badge #{user.badge_number})
            </div>
            <textarea
              className="win-input mono-field"
              value={formData.narrative}
              onChange={(e) => setFormData({...formData, narrative: e.target.value})}
              required
              style={{ width: '100%', minHeight: '250px', fontFamily: '"Roboto Mono", monospace', fontSize: '11px', lineHeight: '1.6' }}
              placeholder="Full narrative will appear here after AI generation, or you can type manually..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="win-button" disabled={submitting}>
            <Save className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            {submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
          </button>
          <button type="button" className="win-button" onClick={() => window.print()}>
            PRINT REPORT
          </button>
        </div>
      </form>
    </div>
  );
}
