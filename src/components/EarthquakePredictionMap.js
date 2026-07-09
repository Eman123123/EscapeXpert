// src/components/EarthquakePredictionMap.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker for clicked location
const customIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ onLocationClick }) {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationClick(lat, lng);
            
            // Add a marker at clicked location
            L.marker([lat, lng], { icon: customIcon })
                .addTo(map)
                .bindPopup(`Selected Location<br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}`)
                .openPopup();
        }
    });
    return null;
}

const EarthquakePredictionMap = ({ onLocationSelect }) => {
    const [map, setMap] = useState(null);

    const handleLocationClick = (lat, lng) => {
        onLocationSelect(lat, lng);
    };

    return (
        <MapContainer
            center={[30.3753, 69.3451]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            whenCreated={setMap}
        >
            <TileLayer
                url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                attribution="&copy; Google Maps"
            />
            <LocationMarker onLocationClick={handleLocationClick} />
        </MapContainer>
    );
};

export default EarthquakePredictionMap;