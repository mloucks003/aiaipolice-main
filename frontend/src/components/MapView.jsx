import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView({ units, incidents }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40.7580, -73.9855], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add incident markers
    incidents.forEach(incident => {
      const priorityColors = {
        1: '#ef4444',
        2: '#f97316',
        3: '#f59e0b',
        4: '#3b82f6',
        5: '#6b7280'
      };

      const icon = L.divIcon({
        className: 'custom-incident-marker',
        html: `<div style="background-color: ${priorityColors[incident.priority] || '#6b7280'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], { icon })
        .bindPopup(`
          <div style="color: #1a1f2e;">
            <strong>${incident.type}</strong><br/>
            Priority: ${incident.priority}<br/>
            ${incident.location.address}<br/>
            <small>${incident.description}</small>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });

    // Add unit markers
    units.forEach(unit => {
      if (!unit.location) return;

      const statusColors = {
        'Available': '#10b981',
        'En Route': '#f59e0b',
        'On Scene': '#ef4444',
        'Out of Service': '#6b7280'
      };

      const icon = L.divIcon({
        className: 'custom-unit-marker',
        html: `<div style="background-color: ${statusColors[unit.status] || '#6b7280'}; width: 20px; height: 20px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">${unit.type[0]}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([unit.location.lat, unit.location.lng], { icon })
        .bindPopup(`
          <div style="color: #1a1f2e;">
            <strong>${unit.callsign}</strong><br/>
            Type: ${unit.type}<br/>
            Status: ${unit.status}<br/>
            ${unit.assigned_officer ? `Officer: ${unit.assigned_officer}` : ''}
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });
  }, [units, incidents]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
      data-testid="map-view"
    ></div>
  );
}
