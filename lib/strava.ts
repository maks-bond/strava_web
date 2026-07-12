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
}

export async function getStravaActivities(accessToken: string): Promise<StravaActivitiesResult> {
    try {
        const response = await fetch(
            "https://www.strava.com/api/v3/athlete/activities?per_page=200",
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

        return { activities: (await response.json()) as StravaActivity[] }
    } catch (error) {
        console.error("Error fetching Strava activities", error)
        return { activities: [], error: "unavailable" }
    }
}
