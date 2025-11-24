import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { getStravaActivities } from "@/lib/strava"
import MapWrapper from '@/components/MapWrapper'

export default async function Home() {
  const session = await getServerSession(authOptions)
  let activities: any[] = []

  if (session?.accessToken) {
    const allActivities = await getStravaActivities(session.accessToken as string)
    // Filter for Runs and Hikes only
    activities = allActivities.filter(activity =>
      activity.type === 'Run' || activity.type === 'Hike' || activity.type === 'TrailRun'
    )
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header */}
      <div className="z-20 w-full flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shadow-md">
        <h1 className="text-xl font-bold text-[#FC4C02]">Strava Run Visualizer</h1>

        {session ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-gray-300">
              {session.user?.name}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {session ? (
          <div className="absolute inset-0 z-0">
            <MapWrapper activities={activities} />

            {/* Overlay Stats */}
            <div className="absolute bottom-8 left-4 right-4 z-[1000] pointer-events-none">
              <div className="bg-gray-900/90 backdrop-blur-sm text-white border border-gray-800 p-4 rounded-xl shadow-lg max-w-md mx-auto pointer-events-auto">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Recent Activities</p>
                    <p className="text-2xl font-bold">{activities.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Visualize Your Journey</h2>
                <p className="text-gray-400 mb-8">
                  Connect with Strava to see all your runs on an interactive map and plan your next adventure.
                </p>
              </div>

              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-full transition-colors text-lg shadow-lg shadow-orange-900/20"
              >
                Connect with Strava
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
