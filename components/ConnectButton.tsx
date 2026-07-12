"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function ConnectButton({ label = "Connect with Strava" }: { label?: string }) {
    const [loading, setLoading] = useState(false)

    return (
        <button
            type="button"
            disabled={loading}
            onClick={() => {
                setLoading(true)
                void signIn("strava", { callbackUrl: "/" })
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#fc4c02] px-7 py-3 font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#e34402] disabled:cursor-wait disabled:opacity-70"
        >
            {loading ? "Opening Strava…" : label}
        </button>
    )
}
