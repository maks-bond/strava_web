export interface StravaActivity {
    id: number
    name: string
    map: {
        summary_polyline: string | null
    }
    start_latlng: [number, number] | null
    type: string
    sport_type?: string
    distance: number
    moving_time: number
    elapsed_time?: number
    total_elevation_gain?: number
    start_date: string
    start_date_local?: string
}

export type StravaActivitiesResult = {
    activities: StravaActivity[]
    error?: "unauthorized" | "rate_limited" | "unavailable"
    hasMore?: boolean
}

export async function getStravaActivities(
    accessToken: string,
    { before, perPage = 200 }: { before?: number; perPage?: number } = {},
): Promise<StravaActivitiesResult> {
    try {
        const params = new URLSearchParams({ per_page: String(perPage) })
        if (before) params.set("before", String(before))
        const response = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?${params}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: "no-store",
            },
        )

        if (response.status === 401) return { activities: [], error: "unauthorized" }
        if (response.status === 429) return { activities: [], error: "rate_limited" }
        if (!response.ok) {
            console.error("Strava activities request failed", response.status, response.statusText)
            return { activities: [], error: "unavailable" }
        }

        const activities = (await response.json()) as StravaActivity[]
        return { activities, hasMore: activities.length === perPage }
    } catch (error) {
        console.error("Error fetching Strava activities", error)
        return { activities: [], error: "unavailable" }
    }
}
