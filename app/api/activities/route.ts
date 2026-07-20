import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getStravaActivities } from "@/lib/strava"

const ROUTE_TYPES = new Set(["Run", "Hike", "TrailRun"])

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken || session.authError) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const beforeValue = Number(searchParams.get("before"))
    const before = Number.isSafeInteger(beforeValue) && beforeValue > 0 ? beforeValue : undefined
    const requestedLimit = Number(searchParams.get("limit") ?? "200")
    const perPage = requestedLimit === 10 ? 10 : 200
    const result = await getStravaActivities(session.accessToken, { before, perPage })

    if (result.error) {
        const status = result.error === "unauthorized" ? 401 : result.error === "rate_limited" ? 429 : 503
        return NextResponse.json({ error: result.error }, { status })
    }

    const oldestActivity = result.activities.at(-1)
    return NextResponse.json({
        activities: result.activities.filter((activity) =>
            ROUTE_TYPES.has(activity.type) && Boolean(activity.map.summary_polyline),
        ),
        hasMore: result.hasMore,
        nextBefore: oldestActivity
            ? Math.floor(new Date(oldestActivity.start_date).getTime() / 1000)
            : undefined,
    }, { headers: { "Cache-Control": "private, no-store" } })
}
