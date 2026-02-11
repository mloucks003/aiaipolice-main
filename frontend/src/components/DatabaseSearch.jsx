import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, User, Car } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DatabaseSearch({ token }) {
  const [searchType, setSearchType] = useState('person');
  const [personQuery, setPersonQuery] = useState({ first_name: '', last_name: '', dob: '', dl: '' });
  const [vehicleQuery, setVehicleQuery] = useState({ plate: '', vin: '' });
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handlePersonSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (personQuery.first_name) params.append('first_name', personQuery.first_name);
      if (personQuery.last_name) params.append('last_name', personQuery.last_name);
      if (personQuery.dob) params.append('dob', personQuery.dob);
      if (personQuery.dl) params.append('dl', personQuery.dl);
      
      const response = await axios.get(`${API}/search/person?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      toast.success(`Found ${response.data.length} record(s)`);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleVehicleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (vehicleQuery.plate) params.append('plate', vehicleQuery.plate);
      if (vehicleQuery.vin) params.append('vin', vehicleQuery.vin);
      
      const response = await axios.get(`${API}/search/vehicle?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      toast.success(`Found ${response.data.length} record(s)`);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="field-group" style={{ marginBottom: '12px' }}>
        <legend>SEARCH TYPE</legend>
        <div style={{ display: 'flex', gap: '12px', padding: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <input
              type="radio"
              checked={searchType === 'person'}
              onChange={() => { setSearchType('person'); setResults([]); }}
            />
            <User className="w-4 h-4" />
            PERSON / WARRANT
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <input
              type="radio"
              checked={searchType === 'vehicle'}
              onChange={() => { setSearchType('vehicle'); setResults([]); }}
            />
            <Car className="w-4 h-4" />
            VEHICLE / PLATE
          </label>
        </div>
      </div>

      {searchType === 'person' && (
        <div className="field-group">
          <legend>PERSON SEARCH - NCIC DATABASE</legend>
          <form onSubmit={handlePersonSearch} style={{ padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>LAST NAME:</label>
                <input
                  type="text"
                  className="win-input"
                  value={personQuery.last_name}
                  onChange={(e) => setPersonQuery({...personQuery, last_name: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  placeholder="DOE"
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>FIRST NAME:</label>
                <input
                  type="text"
                  className="win-input"
                  value={personQuery.first_name}
                  onChange={(e) => setPersonQuery({...personQuery, first_name: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  placeholder="JOHN"
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DATE OF BIRTH:</label>
                <input
                  type="date"
                  className="win-input"
                  value={personQuery.dob}
                  onChange={(e) => setPersonQuery({...personQuery, dob: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>DRIVER LICENSE:</label>
                <input
                  type="text"
                  className="win-input"
                  value={personQuery.dl}
                  onChange={(e) => setPersonQuery({...personQuery, dl: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  placeholder="D1234567"
                />
              </div>
            </div>
            <button type="submit" className="win-button" disabled={searching}>
              <Search className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
              {searching ? 'SEARCHING...' : 'SEARCH DATABASE'}
            </button>
          </form>
        </div>
      )}

      {searchType === 'vehicle' && (
        <div className="field-group">
          <legend>VEHICLE SEARCH - DMV / STOLEN</legend>
          <form onSubmit={handleVehicleSearch} style={{ padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>LICENSE PLATE:</label>
                <input
                  type="text"
                  className="win-input"
                  value={vehicleQuery.plate}
                  onChange={(e) => setVehicleQuery({...vehicleQuery, plate: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  placeholder="ABC123"
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>VIN NUMBER:</label>
                <input
                  type="text"
                  className="win-input"
                  value={vehicleQuery.vin}
                  onChange={(e) => setVehicleQuery({...vehicleQuery, vin: e.target.value})}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  placeholder="1HGBH41JXMN109186"
                />
              </div>
            </div>
            <button type="submit" className="win-button" disabled={searching}>
              <Search className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} />
              {searching ? 'SEARCHING...' : 'SEARCH DATABASE'}
            </button>
          </form>
        </div>
      )}

      {results.length > 0 && (
        <div className="field-group" style={{ marginTop: '12px' }}>
          <legend>SEARCH RESULTS - {results.length} RECORD(S) FOUND</legend>
          <div style={{ padding: '8px', maxHeight: '400px', overflow: 'auto' }}>
            {searchType === 'person' ? (
              <table className="win-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>DOB</th>
                    <th>DL</th>
                    <th>ADDRESS</th>
                    <th>WARRANTS</th>
                    <th>PRIORS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((person, idx) => (
                    <tr key={idx}>
                      <td className="mono-field">{person.last_name}, {person.first_name}</td>
                      <td className="mono-field">{person.dob}</td>
                      <td className="mono-field">{person.drivers_license || 'N/A'}</td>
                      <td style={{ fontSize: '10px' }}>{person.address || 'Unknown'}</td>
                      <td className={person.warrants?.length > 0 ? 'status-wanted' : ''}>
                        {person.warrants?.length > 0 ? `${person.warrants.length} ACTIVE` : 'NONE'}
                      </td>
                      <td className={person.priors?.length > 0 ? 'status-caution' : ''}>
                        {person.priors?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="win-table">
                <thead>
                  <tr>
                    <th>PLATE</th>
                    <th>STATE</th>
                    <th>VIN</th>
                    <th>VEHICLE</th>
                    <th>OWNER</th>
                    <th>STATUS</th>
                    <th>FLAGS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((vehicle, idx) => (
                    <tr key={idx}>
                      <td className="mono-field">{vehicle.plate_number}</td>
                      <td className="mono-field">{vehicle.state}</td>
                      <td className="mono-field" style={{ fontSize: '9px' }}>{vehicle.vin || 'N/A'}</td>
                      <td>{vehicle.year} {vehicle.make} {vehicle.model}</td>
                      <td style={{ fontSize: '10px' }}>{vehicle.registered_owner || 'Unknown'}</td>
                      <td className="status-active">{vehicle.registration_status || 'Unknown'}</td>
                      <td className={vehicle.flags?.length > 0 ? 'status-wanted' : ''}>
                        {vehicle.flags?.length > 0 ? vehicle.flags.join(', ') : 'NONE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
