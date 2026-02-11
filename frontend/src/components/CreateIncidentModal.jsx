import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INCIDENT_TYPES = [
  'Traffic Accident',
  'Medical Emergency',
  'Fire',
  'Theft',
  'Assault',
  'Burglary',
  'Domestic Disturbance',
  'Suspicious Activity',
  'Other'
];

export default function CreateIncidentModal({ token, onClose, onIncidentCreated }) {
  const [formData, setFormData] = useState({
    type: 'Traffic Accident',
    address: '',
    lat: 40.7580,
    lng: -73.9855,
    priority: 3,
    description: '',
    callerName: '',
    callerPhone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        type: formData.type,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address
        },
        priority: parseInt(formData.priority),
        description: formData.description,
        caller_info: formData.callerName || formData.callerPhone ? {
          name: formData.callerName || null,
          phone: formData.callerPhone || null
        } : null
      };

      const response = await axios.post(`${API}/incidents`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Incident created successfully');
      onIncidentCreated(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-testid="create-incident-modal">
      <div className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Create New Incident</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" data-testid="close-modal-button">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Incident Type</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#0f1419] border border-gray-700 text-white rounded-md px-3 py-2"
                data-testid="incident-type-select"
              >
                {INCIDENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Priority (1=Highest)</Label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#0f1419] border border-gray-700 text-white rounded-md px-3 py-2"
                data-testid="priority-select"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>Priority {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="bg-[#0f1419] border-gray-700 text-white"
              placeholder="Enter incident location"
              data-testid="address-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                required
                className="bg-[#0f1419] border-gray-700 text-white"
                data-testid="latitude-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                required
                className="bg-[#0f1419] border-gray-700 text-white"
                data-testid="longitude-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="bg-[#0f1419] border-gray-700 text-white min-h-[100px]"
              placeholder="Describe the incident..."
              data-testid="description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Caller Name (Optional)</Label>
              <Input
                value={formData.callerName}
                onChange={(e) => setFormData({ ...formData, callerName: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
                placeholder="John Doe"
                data-testid="caller-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Caller Phone (Optional)</Label>
              <Input
                value={formData.callerPhone}
                onChange={(e) => setFormData({ ...formData, callerPhone: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
                placeholder="(555) 123-4567"
                data-testid="caller-phone-input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="submit-incident-button"
            >
              {loading ? 'Creating...' : 'Create Incident'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300"
              data-testid="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
