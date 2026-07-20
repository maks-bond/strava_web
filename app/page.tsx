import { getServerSession } from "next-auth"
import Link from "next/link"
import ActivityExplorer from "@/components/ActivityExplorer"
import ConnectButton from "@/components/ConnectButton"
import { authOptions } from "@/lib/auth"

const AUTH_ERRORS: Record<string, string> = {
    AccessDenied: "Strava did not grant access. Please try again and approve activity access.",
    Configuration: "The Strava login configuration is incomplete. Check the callback domain and app credentials.",
    OAuthCallback: "Strava could not complete the login. Check the app's Authorization Callback Domain.",
    OAuthSignin: "The connection to Strava could not be started. Please try again.",
}

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const session = await getServerSession(authOptions)
    const { error: oauthError } = await searchParams
    const needsReconnect = session?.authError === "RefreshAccessTokenError"

    return (
        <main className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-white">
            <header className="z-20 flex min-h-16 w-full items-center justify-between border-b border-white/10 bg-slate-950 px-4 shadow-md sm:px-6">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-[#fc4c02] sm:text-xl">
                        Strava Run Visualizer
                    </h1>
                    <p className="hidden text-xs text-slate-400 sm:block">
                        Your latest mapped runs and hikes
                    </p>
                </div>

                {session && (
                    <div className="flex items-center gap-3">
                        <span className="hidden max-w-48 truncate text-sm text-slate-300 sm:inline">
                            {session.user?.name}
                        </span>
                        <Link
                            href="/api/auth/signout"
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
                        >
                            Sign out
                        </Link>
                    </div>
                )}
            </header>

            <section className="relative flex-1">
                {session && !needsReconnect ? (
                    <ActivityExplorer />
                ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center">
                        <div className="max-w-lg">
                            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-[#fc4c02] text-3xl shadow-xl shadow-orange-950/40">
                                ↗
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                See where your miles take you
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-slate-400">
                                Connect Strava once to explore your latest runs, trail runs, and hikes on an interactive map.
                            </p>

                            {(oauthError || needsReconnect) && (
                                <div role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-left text-sm text-red-100">
                                    <p className="font-semibold">Strava connection needs attention</p>
                                    <p className="mt-1 text-red-200/80">
                                        {needsReconnect
                                            ? "Your saved Strava connection could not be refreshed. Reconnect once to replace it."
                                            : AUTH_ERRORS[oauthError ?? ""] ?? "Login did not complete. Please try again."}
                                    </p>
                                </div>
                            )}

                            <div className="mt-8">
                                <ConnectButton label={needsReconnect ? "Reconnect Strava" : "Connect with Strava"} />
                            </div>
                            <p className="mt-4 text-xs text-slate-500">
                                The app keeps an encrypted session and refreshes Strava access automatically.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}
