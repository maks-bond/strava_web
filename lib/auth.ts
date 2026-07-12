import type { NextAuthOptions } from "next-auth"
import StravaProvider from "next-auth/providers/strava"

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
const REFRESH_BUFFER_SECONDS = 5 * 60

type RefreshResponse = {
    access_token: string
    refresh_token: string
    expires_at: number
}

async function refreshAccessToken(token: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
}) {
    if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" as const }
    }

    try {
        const response = await fetch(STRAVA_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.STRAVA_CLIENT_ID ?? "",
                client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
            cache: "no-store",
        })

        const refreshed = (await response.json()) as RefreshResponse & { message?: string }
        if (!response.ok) {
            throw new Error(refreshed.message || `Strava token refresh failed (${response.status})`)
        }

        return {
            ...token,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || token.refreshToken,
            expiresAt: refreshed.expires_at,
            error: undefined,
        }
    } catch (error) {
        console.error("Unable to refresh the Strava access token", error)
        return { ...token, error: "RefreshAccessTokenError" as const }
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        StravaProvider({
            clientId: process.env.STRAVA_CLIENT_ID!,
            clientSecret: process.env.STRAVA_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "activity:read_all",
                    approval_prompt: "auto",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                    error: undefined,
                }
            }

            const expiresAt = token.expiresAt ?? 0
            if (token.accessToken && Date.now() < (expiresAt - REFRESH_BUFFER_SECONDS) * 1000) {
                return token
            }

            return refreshAccessToken(token)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken
            session.authError = token.error
            return session
        },
    },
}
