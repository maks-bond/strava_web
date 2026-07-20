"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import polyline from "@mapbox/polyline"
import type { StravaActivity } from "@/lib/strava"

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface MapProps {
    activities: StravaActivity[]
    selectedActivityId?: number
    onSelectActivity: (id: number) => void
}

type Route = {
    activity: StravaActivity
    positions: [number, number][]
}

function MapViewport({ routes, selectedActivityId }: {
    routes: Route[]
    selectedActivityId?: number
}) {
    const map = useMap()
    const lastSelectedActivityId = useRef<number | undefined>(undefined)

    useEffect(() => {
        const selectionChanged = selectedActivityId !== undefined
            && selectedActivityId !== lastSelectedActivityId.current
        if (!selectionChanged) return

        const selected = routes.find((route) => route.activity.id === selectedActivityId)
        const positions = selected?.positions ?? []
        if (positions.length > 0) {
            map.fitBounds(L.latLngBounds(positions), {
                padding: [36, 36],
                maxZoom: 15,
                animate: true,
            })
            lastSelectedActivityId.current = selectedActivityId
        }
    }, [map, routes, selectedActivityId])

    return null
}

function LocationMarker() {
    const [position, setPosition] = useState<L.LatLng | null>(null)
    const map = useMap()

    useEffect(() => {
        const onFound = (event: L.LocationEvent) => {
            setPosition(event.latlng)
            map.flyTo(event.latlng, Math.max(map.getZoom(), 14), {
                animate: true,
                duration: 1,
            })
        }
        map.on("locationfound", onFound)
        map.locate({ setView: false })
        return () => {
            map.off("locationfound", onFound)
            map.stopLocate()
        }
    }, [map])

    return position ? (
        <Marker position={position}>
            <Popup>You are here</Popup>
        </Marker>
    ) : null
}

export default function Map({ activities, selectedActivityId, onSelectActivity }: MapProps) {
    const routes = useMemo<Route[]>(() => activities.flatMap((activity) => {
        if (!activity.map.summary_polyline) return []
        try {
            return [{
                activity,
                positions: polyline.decode(activity.map.summary_polyline) as [number, number][],
            }]
        } catch (error) {
            console.error("Failed to decode polyline for activity", activity.id, error)
            return []
        }
    }), [activities])

    return (
        <MapContainer
            center={[37.7749, -122.4194]}
            zoom={11}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapViewport routes={routes} selectedActivityId={selectedActivityId} />
            <LocationMarker />

            {routes.map(({ activity, positions }) => {
                const selected = activity.id === selectedActivityId
                return (
                    <Polyline
                        key={activity.id}
                        positions={positions}
                        pathOptions={{
                            color: selected ? "#111827" : "#fc4c02",
                            weight: selected ? 6 : 3,
                            opacity: selected ? 1 : 0.68,
                        }}
                        eventHandlers={{ click: () => onSelectActivity(activity.id) }}
                    >
                        <Popup>
                            <div className="font-sans">
                                <strong>{activity.name}</strong>
                                <p>{(activity.distance / 1000).toFixed(2)} km</p>
                                <p>{new Date(activity.start_date).toLocaleDateString()}</p>
                            </div>
                        </Popup>
                    </Polyline>
                )
            })}
        </MapContainer>
    )
}
