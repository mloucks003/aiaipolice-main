import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileWarning, Car, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TRAFFIC_VIOLATIONS = [
  { code: 'VC-22350', description: 'Speeding - Basic Speed Law' },
  { code: 'VC-21453', description: 'Failure to Stop at Red Light' },
  { code: 'VC-22454', description: 'Failure to Stop at Stop Sign' },
  { code: 'VC-23152', description: 'DUI - Driving Under the Influence' },
  { code: 'VC-12500', description: 'Driving Without Valid License' },
  { code: 'VC-16028', description: 'No Proof of Insurance' },
];

const CRIMINAL_VIOLATIONS = [
  { code: 'PC-459', description: 'Burglary' },
  { code: 'PC-487', description: 'Grand Theft' },
  { code: 'PC-484', description: 'Petty Theft' },
  { code: 'PC-242', description: 'Battery' },
  { code: 'PC-415', description: 'Disturbing the Peace' },
  { code: 'PC-148', description: 'Resisting Arrest' },
];

export default function CitationForm({ token, user }) {
  const [citationType, setCitationType] = useState('traffic');
  const [formData, setFormData] = useState({
    violation_code: '',
    violation_description: '',
    offender_name: '',
    offender_dl: '',
    offender_dob: '',
    offender_address: '',
    vehicle_plate: '',
    vehicle_info: '',
    location: '',
    date_time: new Date().toISOString().slice(0, 16),
    fine_amount: '',
    court_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const violations = citationType === 'traffic' ? TRAFFIC_VIOLATIONS : CRIMINAL_VIOLATIONS;

  const handleViolationSelect = (e) => {
    const selected = violations.find(v => v.code === e.target.value);
    if (selected) {
      setFormData({
        ...formData,
        violation_code: selected.code,
        violation_description: selected.description
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/citations`, 
        { ...formData, citation_type: citationType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Citation issued successfully');
      // Reset form
      setFormData({
        violation_code: '',
        violation_description: '',
        offender_name: '',
        offender_dl: '',
        offender_dob: '',
        offender_address: '',
        vehicle_plate: '',
        vehicle_info: '',
        location: '',
        date_time: new Date().toISOString().slice(0, 16),
        fine_amount: '',
        court_date: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to issue citation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="field-group" style={{ marginBottom: '12px' }}>
        <legend>CITATION TYPE</legend>
        <div style={{ display: 'flex', gap: '12px', padding: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <input
              type="radio"
              checked={citationType === 'traffic'}
              onChange={() => setCitationType('traffic')}
            />
            <Car className="w-4 h-4" />
            TRAFFIC CITATION
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <input
              type="radio"
              checked={citationType === 'criminal'}
              onChange={() => setCitationType('criminal')}
            />
            <User className="w-4 h-4" />
            CRIMINAL CITATION
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>VIOLATION INFORMATION</legend>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>VIOLATION CODE:</label>
              <select
                className="win-input"
                onChange={handleViolationSelect}
                required
                style={{ width: '100%' }}
              >
                <option value="">-- SELECT VIOLATION --</option>
                {violations.map(v => (
                  <option key={v.code} value={v.code}>{v.code} - {v.description}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DESCRIPTION:</label>
              <input
                type="text"
                className="win-input mono-field"
                value={formData.violation_description}
                readOnly
                style={{ width: '100%', background: '#e0e0e0' }}
              />
            </div>
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>OFFENDER INFORMATION</legend>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>FULL NAME:</label>
              <input
                type="text"
                className="win-input"
                value={formData.offender_name}
                onChange={(e) => setFormData({...formData, offender_name: e.target.value})}
                required
                style={{ width: '100%', textTransform: 'uppercase' }}
                placeholder="LAST, FIRST MIDDLE"
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DRIVER LICENSE:</label>
              <input
                type="text"
                className="win-input mono-field"
                value={formData.offender_dl}
                onChange={(e) => setFormData({...formData, offender_dl: e.target.value})}
                style={{ width: '100%', textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DATE OF BIRTH:</label>
              <input
                type="date"
                className="win-input"
                value={formData.offender_dob}
                onChange={(e) => setFormData({...formData, offender_dob: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>ADDRESS:</label>
              <input
                type="text"
                className="win-input"
                value={formData.offender_address}
                onChange={(e) => setFormData({...formData, offender_address: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {citationType === 'traffic' && (
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <legend>VEHICLE INFORMATION</legend>
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>LICENSE PLATE:</label>
                <input
                  type="text"
                  className="win-input mono-field"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>VEHICLE:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.vehicle_info}
                  onChange={(e) => setFormData({...formData, vehicle_info: e.target.value})}
                  style={{ width: '100%' }}
                  placeholder="YEAR MAKE MODEL COLOR"
                />
              </div>
            </div>
          </div>
        )}

        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>INCIDENT DETAILS</legend>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>LOCATION:</label>
              <input
                type="text"
                className="win-input"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
                style={{ width: '100%' }}
                placeholder="STREET ADDRESS OR INTERSECTION"
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DATE/TIME:</label>
              <input
                type="datetime-local"
                className="win-input"
                value={formData.date_time}
                onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>FINE AMOUNT ($):</label>
              <input
                type="number"
                className="win-input mono-field"
                value={formData.fine_amount}
                onChange={(e) => setFormData({...formData, fine_amount: e.target.value})}
                style={{ width: '100%' }}
                step="0.01"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>NOTES:</label>
              <textarea
                className="win-input"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', minHeight: '60px', fontFamily: 'inherit' }}
                placeholder="Additional details..."
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="win-button" disabled={submitting}>
            <FileWarning className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            {submitting ? 'ISSUING...' : 'ISSUE CITATION'}
          </button>
          <button type="button" className="win-button" onClick={() => window.print()}>
            PRINT CITATION
          </button>
        </div>
      </form>
    </div>
  );
}
