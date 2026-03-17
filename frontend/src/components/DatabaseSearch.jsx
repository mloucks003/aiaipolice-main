import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, User, Car, UserPlus, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function DatabaseSearch({ token }) {
  const [searchType, setSearchType] = useState('person');
  const [personQuery, setPersonQuery] = useState({ first_name: '', last_name: '', dob: '', dl: '' });
  const [vehicleQuery, setVehicleQuery] = useState({ plate: '', vin: '' });
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [personForm, setPersonForm] = useState({ first_name: '', last_name: '', middle_name: '', dob: '', drivers_license: '', dl_state: '', address: '', city: '', state: '', zip_code: '', phone: '', race: '', sex: '', height: '', weight: '', eye_color: '', hair_color: '', notes: '' });
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', state: '', vin: '', make: '', model: '', year: '', color: '', registered_owner: '', insurance_status: 'Active', registration_status: 'Active', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/persons`, personForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Person record created');
      setPersonForm({ first_name: '', last_name: '', middle_name: '', dob: '', drivers_license: '', dl_state: '', address: '', city: '', state: '', zip_code: '', phone: '', race: '', sex: '', height: '', weight: '', eye_color: '', hair_color: '', notes: '' });
      setShowAddPerson(false);
    } catch (error) {
      toast.error('Failed to create person');
    } finally { setSaving(false); }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...vehicleForm };
      if (data.year) data.year = parseInt(data.year);
      await axios.post(`${API}/vehicles`, data, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Vehicle record created');
      setVehicleForm({ plate_number: '', state: '', vin: '', make: '', model: '', year: '', color: '', registered_owner: '', insurance_status: 'Active', registration_status: 'Active', notes: '' });
      setShowAddVehicle(false);
    } catch (error) {
      toast.error('Failed to create vehicle');
    } finally { setSaving(false); }
  };

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
        <div style={{ display: 'flex', gap: '12px', padding: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <input type="radio" checked={searchType === 'person'} onChange={() => { setSearchType('person'); setResults([]); }} />
              <User className="w-4 h-4" /> PERSON / WARRANT
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <input type="radio" checked={searchType === 'vehicle'} onChange={() => { setSearchType('vehicle'); setResults([]); }} />
              <Car className="w-4 h-4" /> VEHICLE / PLATE
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="win-button" onClick={() => { setShowAddPerson(!showAddPerson); setShowAddVehicle(false); }} style={{ fontSize: '11px', padding: '3px 10px' }}>
              <UserPlus className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} /> ADD PERSON
            </button>
            <button className="win-button" onClick={() => { setShowAddVehicle(!showAddVehicle); setShowAddPerson(false); }} style={{ fontSize: '11px', padding: '3px 10px' }}>
              <Plus className="w-3 h-3" style={{ display: 'inline', marginRight: '4px' }} /> ADD VEHICLE
            </button>
          </div>
        </div>
      </div>

      {showAddPerson && (
        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>CREATE PERSON RECORD</legend>
          <form onSubmit={handleCreatePerson} style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>FIRST NAME:</label><input type="text" className="win-input" value={personForm.first_name} onChange={(e) => setPersonForm({...personForm, first_name: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} required /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>MIDDLE NAME:</label><input type="text" className="win-input" value={personForm.middle_name} onChange={(e) => setPersonForm({...personForm, middle_name: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>LAST NAME:</label><input type="text" className="win-input" value={personForm.last_name} onChange={(e) => setPersonForm({...personForm, last_name: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} required /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>DOB:</label><input type="date" className="win-input" value={personForm.dob} onChange={(e) => setPersonForm({...personForm, dob: e.target.value})} style={{ width: '100%' }} required /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>SEX:</label><select className="win-input" value={personForm.sex} onChange={(e) => setPersonForm({...personForm, sex: e.target.value})} style={{ width: '100%' }}><option value="">--</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>RACE:</label><input type="text" className="win-input" value={personForm.race} onChange={(e) => setPersonForm({...personForm, race: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>DRIVER LICENSE:</label><input type="text" className="win-input" value={personForm.drivers_license} onChange={(e) => setPersonForm({...personForm, drivers_license: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>DL STATE:</label><input type="text" className="win-input" value={personForm.dl_state} onChange={(e) => setPersonForm({...personForm, dl_state: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} maxLength={2} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>PHONE:</label><input type="text" className="win-input" value={personForm.phone} onChange={(e) => setPersonForm({...personForm, phone: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>ADDRESS:</label><input type="text" className="win-input" value={personForm.address} onChange={(e) => setPersonForm({...personForm, address: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>CITY:</label><input type="text" className="win-input" value={personForm.city} onChange={(e) => setPersonForm({...personForm, city: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>STATE:</label><input type="text" className="win-input" value={personForm.state} onChange={(e) => setPersonForm({...personForm, state: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} maxLength={2} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>HEIGHT:</label><input type="text" className="win-input" value={personForm.height} onChange={(e) => setPersonForm({...personForm, height: e.target.value})} style={{ width: '100%' }} placeholder="5'10&quot;" /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>WEIGHT:</label><input type="text" className="win-input" value={personForm.weight} onChange={(e) => setPersonForm({...personForm, weight: e.target.value})} style={{ width: '100%' }} placeholder="180" /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>EYE COLOR:</label><input type="text" className="win-input" value={personForm.eye_color} onChange={(e) => setPersonForm({...personForm, eye_color: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>HAIR COLOR:</label><input type="text" className="win-input" value={personForm.hair_color} onChange={(e) => setPersonForm({...personForm, hair_color: e.target.value})} style={{ width: '100%' }} /></div>
            <div style={{ gridColumn: '2 / -1' }}><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>NOTES:</label><input type="text" className="win-input" value={personForm.notes} onChange={(e) => setPersonForm({...personForm, notes: e.target.value})} style={{ width: '100%' }} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="submit" className="win-button btn-primary" disabled={saving}>{saving ? 'SAVING...' : 'CREATE PERSON'}</button>
              <button type="button" className="win-button" onClick={() => setShowAddPerson(false)}>CANCEL</button>
            </div>
          </form>
        </div>
      )}

      {showAddVehicle && (
        <div className="field-group" style={{ marginBottom: '12px' }}>
          <legend>CREATE VEHICLE RECORD</legend>
          <form onSubmit={handleCreateVehicle} style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>PLATE NUMBER:</label><input type="text" className="win-input" value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({...vehicleForm, plate_number: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} required /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>STATE:</label><input type="text" className="win-input" value={vehicleForm.state} onChange={(e) => setVehicleForm({...vehicleForm, state: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} maxLength={2} required /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>VIN:</label><input type="text" className="win-input" value={vehicleForm.vin} onChange={(e) => setVehicleForm({...vehicleForm, vin: e.target.value})} style={{ width: '100%', textTransform: 'uppercase' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>YEAR:</label><input type="number" className="win-input" value={vehicleForm.year} onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})} style={{ width: '100%' }} placeholder="2024" /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>MAKE:</label><input type="text" className="win-input" value={vehicleForm.make} onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})} style={{ width: '100%' }} placeholder="Toyota" /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>MODEL:</label><input type="text" className="win-input" value={vehicleForm.model} onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} style={{ width: '100%' }} placeholder="Camry" /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>COLOR:</label><input type="text" className="win-input" value={vehicleForm.color} onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>REGISTERED OWNER:</label><input type="text" className="win-input" value={vehicleForm.registered_owner} onChange={(e) => setVehicleForm({...vehicleForm, registered_owner: e.target.value})} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>NOTES:</label><input type="text" className="win-input" value={vehicleForm.notes} onChange={(e) => setVehicleForm({...vehicleForm, notes: e.target.value})} style={{ width: '100%' }} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="submit" className="win-button btn-primary" disabled={saving}>{saving ? 'SAVING...' : 'CREATE VEHICLE'}</button>
              <button type="button" className="win-button" onClick={() => setShowAddVehicle(false)}>CANCEL</button>
            </div>
          </form>
        </div>
      )}

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
