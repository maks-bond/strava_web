'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import { StravaActivity } from '@/lib/strava';

// Fix Leaflet marker icon issue in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
    activities: StravaActivity[];
}

function LocationMarker() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);

    return position === null ? null : (
        <Marker position={position}>
            <Popup>You are here</Popup>
        </Marker>
    );
}

export default function Map({ activities }: MapProps) {
    // Default center (can be anything, will be overridden by user location)
    const center: [number, number] = [37.7749, -122.4194];

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            <LocationMarker />

            {activities.map((activity) => {
                if (!activity.map.summary_polyline) return null;

                try {
                    const positions = polyline.decode(activity.map.summary_polyline);
                    return (
                        <Polyline
                            key={activity.id}
                            positions={positions}
                            pathOptions={{ color: '#FC4C02', weight: 3, opacity: 0.7 }}
                        >
                            <Popup>
                                <div className="font-sans">
                                    <h3 className="font-bold">{activity.name}</h3>
                                    <p>{(activity.distance / 1000).toFixed(2)} km</p>
                                    <p>{new Date(activity.start_date).toLocaleDateString()}</p>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                } catch (e) {
                    console.error("Failed to decode polyline for activity", activity.id, e);
                    return null;
                }
            })}
        </MapContainer >
    );
}
