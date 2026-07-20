"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { StravaActivity } from "@/lib/strava"
import MapWrapper from "@/components/MapWrapper"

type LoadError = "unauthorized" | "rate_limited" | "unavailable"
type ActivitiesResponse = {
    activities?: StravaActivity[]
    hasMore?: boolean
    nextBefore?: number
    error?: LoadError
}

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default function ActivityExplorer() {
    const [activities, setActivities] = useState<StravaActivity[]>([])
    const [open, setOpen] = useState(false)
    const [selectedActivityId, setSelectedActivityId] = useState<number>()
    const [loading, setLoading] = useState(true)
    const [complete, setComplete] = useState(false)
    const [error, setError] = useState<LoadError>()
    const before = useRef<number | undefined>(undefined)
    const completedRequests = useRef(0)

    const loadHistory = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        setError(undefined)

        try {
            while (!signal?.aborted) {
                const params = new URLSearchParams({ limit: completedRequests.current < 2 ? "10" : "200" })
                if (before.current) params.set("before", String(before.current))
                const response = await fetch(`/api/activities?${params}`, { signal })
                const data = await response.json() as ActivitiesResponse
                if (!response.ok) throw data

                setActivities((current) => {
                    const known = new Set(current.map((activity) => activity.id))
                    const additions = (data.activities ?? []).filter((activity) => !known.has(activity.id))
                    return [...current, ...additions]
                })
                completedRequests.current += 1
                before.current = data.nextBefore

                if (!data.hasMore || !data.nextBefore) {
                    setComplete(true)
                    break
                }

                // Give React and Leaflet a chance to render each completed page.
                await new Promise<void>((resolve) => window.setTimeout(resolve, 100))
            }
        } catch (reason) {
            if (!signal?.aborted) {
                setError((reason as ActivitiesResponse).error ?? "unavailable")
            }
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        void loadHistory(controller.signal)
        return () => controller.abort()
    }, [loadHistory])

    const sortedActivities = useMemo(() => [...activities].sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    ), [activities])

    const selectActivity = (id: number) => {
        setSelectedActivityId(id)
        setOpen(false)
    }

    const statusText = loading
        ? `Loading older routes · ${activities.length} loaded`
        : complete
            ? `All routes loaded · ${activities.length}`
            : `Loading paused · ${activities.length} loaded`

    return (
        <div className="absolute inset-0">
            <MapWrapper
                activities={sortedActivities}
                selectedActivityId={selectedActivityId}
                onSelectActivity={setSelectedActivityId}
            />

            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="activity-list"
                className="absolute right-4 top-4 z-[1000] flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-white"
            >
                <span aria-hidden="true">☰</span>
                Activities
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-[#c73c00]">
                    {loading && activities.length === 0 ? "…" : activities.length}
                </span>
            </button>

            <div className="absolute bottom-6 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur">
                {loading && <span className="size-2 animate-pulse rounded-full bg-[#fc4c02]" aria-hidden="true" />}
                {complete && <span className="text-emerald-600" aria-hidden="true">✓</span>}
                <span>{statusText}</span>
                {error && (
                    <button type="button" onClick={() => void loadHistory()} className="font-semibold text-[#c73c00] underline">
                        Retry
                    </button>
                )}
            </div>

            {open && (
                <button type="button" aria-label="Close activities" className="absolute inset-0 z-[1100] bg-black/30" onClick={() => setOpen(false)} />
            )}

            <aside
                id="activity-list"
                aria-hidden={!open}
                className={`absolute inset-y-0 left-0 z-[1200] flex w-[min(92vw,25rem)] flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="font-bold">Activities</h2>
                        <p className="text-xs text-slate-400">Newest to oldest · {statusText}</p>
                    </div>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Close activities" className="grid min-h-11 min-w-11 place-items-center rounded-full text-xl hover:bg-white/10">×</button>
                </div>

                <ol className="flex-1 overflow-y-auto">
                    {sortedActivities.map((activity) => (
                        <li key={activity.id} className="border-b border-white/10">
                            <button
                                type="button"
                                onClick={() => selectActivity(activity.id)}
                                className={`w-full px-5 py-4 text-left transition hover:bg-white/10 ${selectedActivityId === activity.id ? "bg-orange-500/15" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{activity.name}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(activity.start_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-orange-400">{(activity.distance / 1000).toFixed(1)} km</span>
                                </div>
                                <div className="mt-2 flex gap-3 text-xs text-slate-400">
                                    <span>{activity.type}</span>
                                    <span>{formatDuration(activity.moving_time)}</span>
                                    {activity.total_elevation_gain !== undefined && <span>{Math.round(activity.total_elevation_gain)} m gain</span>}
                                </div>
                            </button>
                        </li>
                    ))}
                    {loading && <li className="p-5 text-center text-sm text-slate-400">Loading older activities…</li>}
                </ol>
            </aside>

            {error && (
                <div role="alert" className="absolute left-1/2 top-4 z-[1050] w-[min(90vw,32rem)] -translate-x-1/2 rounded-xl border border-amber-300/30 bg-slate-950/95 p-4 text-sm text-white shadow-xl">
                    {error === "unauthorized"
                        ? "Your Strava connection needs to be refreshed. Sign out and connect again."
                        : error === "rate_limited"
                            ? "Strava's request limit was reached. Loaded routes remain available; retry later."
                            : "Older routes could not be loaded. Loaded routes remain available."}
                </div>
            )}

            {!loading && complete && activities.length === 0 && (
                <div className="absolute bottom-20 left-1/2 z-[1000] w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 p-4 text-center text-sm text-slate-700 shadow-lg">
                    No mapped runs or hikes were found in your Strava history.
                </div>
            )}
        </div>
    )
}
