import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { X, MapPin, AlertCircle, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DispatchModal({ incident, units, token, onClose, onDispatchComplete }) {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleUnit = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleDispatch = async () => {
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/dispatch`,
        {
          incident_id: incident.id,
          unit_ids: selectedUnits
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Dispatched ${selectedUnits.length} unit(s)`);
      onDispatchComplete();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to dispatch units');
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig = {
    1: { color: 'text-red-500', bg: 'bg-red-900/20' },
    2: { color: 'text-orange-500', bg: 'bg-orange-900/20' },
    3: { color: 'text-yellow-500', bg: 'bg-yellow-900/20' },
    4: { color: 'text-blue-500', bg: 'bg-blue-900/20' },
    5: { color: 'text-gray-500', bg: 'bg-gray-900/20' }
  };

  const config = priorityConfig[incident.priority] || priorityConfig[3];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-testid="dispatch-modal">
      <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Dispatch Units</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" data-testid="close-modal-button">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Incident Details */}
        <div className={`${config.bg} border border-gray-700 rounded-lg p-4 mb-6`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${config.color}`} />
              <h3 className="text-lg font-semibold">{incident.type}</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.color}`}>
              Priority {incident.priority}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{incident.location.address}</span>
          </div>
          <p className="text-sm text-gray-400">{incident.description}</p>
          {incident.notes && (
            <p className="text-sm text-gray-500 mt-2">Notes: {incident.notes}</p>
          )}
        </div>

        {/* Available Units */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Available Units ({units.length})</h3>
          {units.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No available units</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3" data-testid="unit-selection-grid">
              {units.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => toggleUnit(unit.id)}
                  className={`bg-[#0f1419] border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedUnits.includes(unit.id)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  data-testid="unit-selection-item"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{unit.callsign}</p>
                      <p className="text-xs text-gray-400">{unit.type}</p>
                      {unit.assigned_officer && (
                        <p className="text-xs text-gray-500">{unit.assigned_officer}</p>
                      )}
                    </div>
                    <div className="w-5 h-5 border-2 rounded flex items-center justify-center" style={{
                      borderColor: selectedUnits.includes(unit.id) ? '#3b82f6' : '#4b5563',
                      backgroundColor: selectedUnits.includes(unit.id) ? '#3b82f6' : 'transparent'
                    }}>
                      {selectedUnits.includes(unit.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleDispatch}
            disabled={loading || selectedUnits.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="dispatch-button"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Dispatching...' : `Dispatch ${selectedUnits.length} Unit(s)`}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300"
            data-testid="cancel-button"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
