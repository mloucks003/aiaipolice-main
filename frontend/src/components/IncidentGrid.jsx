import { AlertCircle, MapPin, Clock } from 'lucide-react';

const PRIORITY_CONFIG = {
  1: { color: 'text-red-500', bg: 'bg-red-900/20', label: 'P1 - Critical' },
  2: { color: 'text-orange-500', bg: 'bg-orange-900/20', label: 'P2 - Urgent' },
  3: { color: 'text-yellow-500', bg: 'bg-yellow-900/20', label: 'P3 - Routine' },
  4: { color: 'text-blue-500', bg: 'bg-blue-900/20', label: 'P4 - Low' },
  5: { color: 'text-gray-500', bg: 'bg-gray-900/20', label: 'P5 - Info' }
};

export default function IncidentGrid({ incidents, onIncidentClick }) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No active incidents</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="incident-grid">
      {incidents.map((incident) => {
        const priorityConfig = PRIORITY_CONFIG[incident.priority] || PRIORITY_CONFIG[3];
        return (
          <div
            key={incident.id}
            onClick={() => onIncidentClick(incident)}
            className="bg-[#0f1419] border border-gray-700 rounded-lg p-3 hover:border-blue-500 cursor-pointer transition-all incident-row"
            data-testid="incident-item"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${priorityConfig.color}`} />
                <span className="font-semibold text-sm">{incident.type}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${priorityConfig.bg} ${priorityConfig.color} font-semibold`}>
                P{incident.priority}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {incident.location.address}
            </div>
            <div className="text-xs text-gray-500 mb-2">{incident.description}</div>
            {incident.assigned_units && incident.assigned_units.length > 0 && (
              <div className="text-xs text-cyan-400">
                Units: {incident.assigned_units.length}
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(incident.created_at).toLocaleTimeString()}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                incident.status === 'Open' ? 'bg-green-900/30 text-green-500' :
                incident.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-500' :
                'bg-gray-900/30 text-gray-500'
              }`}>
                {incident.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
