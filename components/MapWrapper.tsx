"use client"

import dynamic from "next/dynamic"
import type { StravaActivity } from "@/lib/strava"

const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
            Loading map…
        </div>
    ),
})

interface MapWrapperProps {
    activities: StravaActivity[]
    selectedActivityId?: number
    onSelectActivity: (id: number) => void
}

export default function MapWrapper(props: MapWrapperProps) {
    return <Map {...props} />
}
