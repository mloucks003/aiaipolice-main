import { Users, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  'Available': { color: 'bg-green-500', textColor: 'text-green-500', label: 'Available' },
  'En Route': { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'En Route' },
  'On Scene': { color: 'bg-red-500', textColor: 'text-red-500', label: 'On Scene' },
  'Out of Service': { color: 'bg-gray-500', textColor: 'text-gray-500', label: 'Out of Service' }
};

const TYPE_CONFIG = {
  'Police': { icon: '👮', color: 'bg-blue-900/30 text-blue-500' },
  'Fire': { icon: '🚒', color: 'bg-red-900/30 text-red-500' },
  'EMS': { icon: '🚑', color: 'bg-green-900/30 text-green-500' }
};

export default function UnitStatusBoard({ units }) {
  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.type]) acc[unit.type] = [];
    acc[unit.type].push(unit);
    return acc;
  }, {});

  return (
    <div className="space-y-4" data-testid="unit-status-board">
      {Object.entries(groupedUnits).map(([type, typeUnits]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <span>{TYPE_CONFIG[type]?.icon || '🚓'}</span>
            {type}
          </h3>
          <div className="space-y-2">
            {typeUnits.map((unit) => {
              const statusConfig = STATUS_CONFIG[unit.status] || STATUS_CONFIG['Available'];
              return (
                <div
                  key={unit.id}
                  className="bg-[#0f1419] border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
                  data-testid="unit-item"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{unit.callsign}</span>
                    <div className="flex items-center gap-1">
                      <Circle className={`w-2 h-2 ${statusConfig.color} fill-current`} />
                      <span className={`text-xs ${statusConfig.textColor}`}>{unit.status}</span>
                    </div>
                  </div>
                  {unit.assigned_officer && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {unit.assigned_officer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
