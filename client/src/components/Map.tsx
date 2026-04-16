import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  markers?: Array<{
    id: number;
    lat: number;
    lng: number;
    title: string;
  }>;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function Map({ markers = [], center = [51.505, -0.09], zoom = 13, className = "h-64 w-full rounded-xl" }: MapProps) {
  return (
    <div className={`${className} overflow-hidden shadow-inner border border-border bg-muted/30 relative z-0`}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(marker => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup className="font-sans">
              <strong>{marker.title}</strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
