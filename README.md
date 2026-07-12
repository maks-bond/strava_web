# Strava Run Visualizer

A Next.js app that connects to Strava and displays the latest 200 activities, filtered to runs,
trail runs, and hikes, on an interactive Leaflet map.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Create a NextAuth secret with `openssl rand -base64 32`. In the Strava API dashboard, set the
Authorization Callback Domain to `localhost` for local development. Strava redirects back to:

```text
http://localhost:3000/api/auth/callback/strava
```

## Authentication

The app uses a 30-day encrypted NextAuth JWT session. Strava access tokens are refreshed
automatically before expiry using the refresh token, so routine use should not require another
login. Reauthorization is needed only if Strava revokes the grant, the refresh token becomes
invalid, the browser session cookie is cleared, or the NextAuth secret changes.

Never place Strava tokens in browser local storage. They would be accessible to client-side
JavaScript and are less secure than the HTTP-only encrypted session cookie used here.

## AWS deployment

The Next.js application is deployed through SST/OpenNext:

```bash
npm run deploy
```

If AWS was authenticated with `aws login` instead of a shared profile, pass its short-lived
credentials to SST for that process:

```bash
eval "$(aws configure export-credentials --format env)"
npm run deploy
```

For the current deployment, use:

```text
NEXTAUTH_URL=https://dly2k41m9jl34.cloudfront.net
Authorization Callback Domain: dly2k41m9jl34.cloudfront.net
Callback URL: https://dly2k41m9jl34.cloudfront.net/api/auth/callback/strava
```

The Strava dashboard field takes only the hostname—no `https://` and no callback path. Deploy
with stable values for `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and
`NEXTAUTH_URL`.

## Cloudflare Pages alias

Like `gym_web`, the `pages-redirect/` directory is a small redirect site. The Next.js app remains
on AWS; Cloudflare Pages gives it a memorable public entry URL.

- Active public alias: `https://strava-maksym.pages.dev/`
- Redirect target: `https://dly2k41m9jl34.cloudfront.net/`
- Cloudflare Pages project: `strava-maksym`

To recreate the project:

1. In Cloudflare, create a Pages project named `strava-maksym`.
2. Use Direct Upload and upload the contents of `pages-redirect/`, or connect the repository and
   set the output directory to `pages-redirect`.
3. Visit `https://strava-maksym.pages.dev/` and confirm it redirects to CloudFront.

Because this is a redirect—not a reverse proxy—the OAuth callback continues to use the CloudFront
hostname. Keep `NEXTAUTH_URL` and Strava's callback domain set to CloudFront.

### AWS Function URL compatibility

SST 3.17.23 may create only the older `lambda:InvokeFunctionUrl` public permission. On current AWS,
the server Lambda also needs `lambda:InvokeFunction` constrained by
`lambda:InvokedViaFunctionUrl=true`. The current deployment has this permission. If the site ever
returns a JSON `403 AccessDeniedException` immediately after recreating its infrastructure, add
that second permission or upgrade SST after reviewing the SST 4 migration.

See `PROJECT_PLAN.md` for architecture, diagnosis, priorities, and the resume checklist.
