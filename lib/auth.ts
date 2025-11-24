import { NextAuthOptions } from "next-auth"
import StravaProvider from "next-auth/providers/strava"

export const authOptions: NextAuthOptions = {
    providers: [
        StravaProvider({
            clientId: process.env.STRAVA_CLIENT_ID!,
            clientSecret: process.env.STRAVA_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "activity:read_all",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
            }
            return token
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken
            return session
        },
    },
}
