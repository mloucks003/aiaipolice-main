import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Car, Users, TrendingUp, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AITools({ token }) {
  const [activeAI, setActiveAI] = useState('plate');
  const [plateData, setPlateData] = useState({ plate_number: '', state: 'CA', context: '' });
  const [plateResult, setPlateResult] = useState(null);
  const [suspectData, setSuspectData] = useState({ description: '' });
  const [suspectResult, setSuspectResult] = useState(null);
  const [crimeAnalysis, setCrimeAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePlateAnalysis = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/analyze-plate`, plateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlateResult(response.data);
      toast.success('Plate analysis complete');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspectMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/match-suspect`, 
        { description: suspectData.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuspectResult(response.data);
      toast.success('Suspect matches found');
    } catch (error) {
      toast.error('Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCrimeAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/ai/predict-crime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCrimeAnalysis(response.data);
      toast.success('Predictive analysis complete');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '12px', padding: '8px', background: '#e0f0ff', border: '2px solid #0058b7' }}>
        <p style={{ fontSize: '11px', margin: 0, color: '#000080' }}>
          <strong>AI-POWERED TOOLS:</strong> Advanced artificial intelligence for plate analysis, suspect identification, and crime prediction.
        </p>
      </div>

      <div className="field-group" style={{ marginBottom: '12px' }}>
        <legend>SELECT AI TOOL</legend>
        <div style={{ display: 'flex', gap: '8px', padding: '8px', flexWrap: 'wrap' }}>
          <button
            className="win-button"
            onClick={() => setActiveAI('plate')}
            style={{ background: activeAI === 'plate' ? '#c0c0c0' : '#f0f0f0' }}
          >
            <Car className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            PLATE ANALYSIS
          </button>
          <button
            className="win-button"
            onClick={() => setActiveAI('suspect')}
            style={{ background: activeAI === 'suspect' ? '#c0c0c0' : '#f0f0f0' }}
          >
            <Users className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            SUSPECT MATCH
          </button>
          <button
            className="win-button"
            onClick={() => setActiveAI('predict')}
            style={{ background: activeAI === 'predict' ? '#c0c0c0' : '#f0f0f0' }}
          >
            <TrendingUp className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
            CRIME PREDICTION
          </button>
        </div>
      </div>

      {activeAI === 'plate' && (
        <div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <legend>AI LICENSE PLATE ANALYSIS</legend>
            <form onSubmit={handlePlateAnalysis} style={{ padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>PLATE NUMBER:</label>
                  <input
                    type="text"
                    className="win-input mono-field"
                    value={plateData.plate_number}
                    onChange={(e) => setPlateData({...plateData, plate_number: e.target.value})}
                    required
                    style={{ width: '100%', textTransform: 'uppercase' }}
                    placeholder="ABC123"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>STATE:</label>
                  <input
                    type="text"
                    className="win-input"
                    value={plateData.state}
                    onChange={(e) => setPlateData({...plateData, state: e.target.value})}
                    required
                    style={{ width: '100%', textTransform: 'uppercase' }}
                    maxLength="2"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>CONTEXT (Optional):</label>
                <input
                  type="text"
                  className="win-input"
                  value={plateData.context}
                  onChange={(e) => setPlateData({...plateData, context: e.target.value})}
                  style={{ width: '100%' }}
                  placeholder="e.g., 'suspicious vehicle near school' or 'traffic stop'"
                />
              </div>
              <button type="submit" className="win-button" disabled={loading}>
                <Sparkles className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                {loading ? 'ANALYZING...' : 'ANALYZE WITH AI'}
              </button>
            </form>
          </div>

          {plateResult && (
            <div className="field-group">
              <legend>AI ANALYSIS RESULT</legend>
              <div style={{ padding: '12px' }}>
                {plateResult.vehicle && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#ffffff', border: '1px solid #808080' }}>
                    <h4 style={{ fontSize: '11px', marginBottom: '8px', color: '#000080' }}>DATABASE RECORD:</h4>
                    <div className="mono-field" style={{ fontSize: '10px' }}>
                      <div><strong>PLATE:</strong> {plateResult.vehicle.plate_number} ({plateResult.vehicle.state})</div>
                      <div><strong>VEHICLE:</strong> {plateResult.vehicle.year} {plateResult.vehicle.make} {plateResult.vehicle.model}</div>
                      <div><strong>OWNER:</strong> {plateResult.vehicle.registered_owner}</div>
                      <div><strong>STATUS:</strong> {plateResult.vehicle.registration_status}</div>
                      {plateResult.vehicle.flags?.length > 0 && (
                        <div className="status-wanted"><strong>FLAGS:</strong> {plateResult.vehicle.flags.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
                {plateResult.analysis && (
                  <div style={{ padding: '8px', background: '#ffffe0', border: '1px solid #808080' }}>
                    <h4 style={{ fontSize: '11px', marginBottom: '8px', color: '#800000' }}>AI RISK ASSESSMENT:</h4>
                    <div style={{ fontSize: '10px' }}>
                      {plateResult.analysis.risk_level && (
                        <div className={plateResult.analysis.risk_level === 'High' ? 'status-wanted' : plateResult.analysis.risk_level === 'Medium' ? 'status-caution' : ''}>
                          <strong>RISK LEVEL:</strong> {plateResult.analysis.risk_level}
                        </div>
                      )}
                      {plateResult.analysis.concerns && (
                        <div><strong>CONCERNS:</strong> {plateResult.analysis.concerns}</div>
                      )}
                      {plateResult.analysis.recommendations && (
                        <div><strong>RECOMMENDATIONS:</strong> {plateResult.analysis.recommendations}</div>
                      )}
                      {plateResult.analysis.raw_response && (
                        <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{plateResult.analysis.raw_response}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeAI === 'suspect' && (
        <div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <legend>AI SUSPECT IDENTIFICATION</legend>
            <form onSubmit={handleSuspectMatch} style={{ padding: '12px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>SUSPECT DESCRIPTION:</label>
                <textarea
                  className="win-input"
                  value={suspectData.description}
                  onChange={(e) => setSuspectData({description: e.target.value})}
                  required
                  style={{ width: '100%', minHeight: '100px', fontFamily: 'inherit' }}
                  placeholder="Enter physical description, clothing, age range, location last seen, etc... (e.g., Male, 5'10, 180lbs, brown hair, wearing black hoodie, late 20s, last seen near Main St)"
                />
              </div>
              <button type="submit" className="win-button" disabled={loading}>
                <Sparkles className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                {loading ? 'MATCHING...' : 'FIND MATCHES WITH AI'}
              </button>
            </form>
          </div>

          {suspectResult && suspectResult.matches && (
            <div className="field-group">
              <legend>POTENTIAL MATCHES - {suspectResult.matches.length} FOUND</legend>
              <div style={{ padding: '12px', maxHeight: '400px', overflow: 'auto' }}>
                {suspectResult.matches.map((match, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', padding: '8px', background: '#ffffff', border: '2px solid #808080' }}>
                    <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                      <strong>MATCH #{idx + 1}</strong> - Confidence: <span className="status-wanted">{match.match_confidence || 'N/A'}</span>
                    </div>
                    <div className="mono-field" style={{ fontSize: '10px' }}>
                      {match.person_id && <div><strong>ID:</strong> {match.person_id}</div>}
                      {match.matching_factors && (
                        <div><strong>FACTORS:</strong> {match.matching_factors.join(', ')}</div>
                      )}
                      {match.notes && <div><strong>NOTES:</strong> {match.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeAI === 'predict' && (
        <div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <legend>PREDICTIVE CRIME ANALYSIS</legend>
            <div style={{ padding: '12px' }}>
              <p style={{ fontSize: '11px', marginBottom: '12px' }}>
                AI will analyze recent incidents to identify crime patterns, hot spots, and provide predictive insights.
              </p>
              <button className="win-button" onClick={handleCrimeAnalysis} disabled={loading}>
                <Sparkles className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
                {loading ? 'ANALYZING...' : 'RUN PREDICTIVE ANALYSIS'}
              </button>
            </div>
          </div>

          {crimeAnalysis && (
            <div className="field-group">
              <legend>ANALYSIS RESULTS</legend>
              <div style={{ padding: '12px' }}>
                <div style={{ background: '#ffffff', padding: '12px', border: '1px solid #808080', fontSize: '10px', whiteSpace: 'pre-wrap', maxHeight: '500px', overflow: 'auto' }}>
                  {crimeAnalysis.raw_response ? (
                    crimeAnalysis.raw_response
                  ) : (
                    <div>
                      {crimeAnalysis.trends && <div><strong>TRENDS:</strong> {JSON.stringify(crimeAnalysis.trends)}</div>}
                      {crimeAnalysis.hotspots && <div><strong>HOTSPOTS:</strong> {JSON.stringify(crimeAnalysis.hotspots)}</div>}
                      {crimeAnalysis.time_patterns && <div><strong>TIME PATTERNS:</strong> {JSON.stringify(crimeAnalysis.time_patterns)}</div>}
                      {crimeAnalysis.predictions && <div><strong>PREDICTIONS:</strong> {JSON.stringify(crimeAnalysis.predictions)}</div>}
                      {crimeAnalysis.recommendations && <div><strong>RECOMMENDATIONS:</strong> {JSON.stringify(crimeAnalysis.recommendations)}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
