# Strava Run Visualizer: Improvement and Deployment Plan

Last updated: 2026-10-11

## Current completed behavior

- Render the authenticated shell and map without waiting for Strava activity data.
- Request the newest 10 activities first, then the next 10, so the map becomes useful in two
  lightweight steps. Continue older history newest-first in timestamp-cursor batches of 200
  (Strava's per-page maximum).
- Continue loading older pages sequentially in the background until Strava returns a short page.
  Do not treat 200 as the history limit or discard routes if a later page fails.
- Show a compact status with the loaded route count, whether history is still loading or fully
  loaded, and a retry action for background failures.
- Never fit the viewport to newly loaded routes. Geolocation controls the initial view; only an
  explicit activity selection changes the viewport to fit that route.
- Strava access tokens refresh automatically in the NextAuth JWT callback. The encrypted session
  lasts 30 days, so ordinary use should not require daily login.
- The activity drawer is chronological (newest first), unobtrusive, and supports selecting an
  individual route. The Activities button is in the upper-right, away from Leaflet zoom controls.
- Loading, empty, rate-limit, API failure, expired-auth, and retry states are visible without
  removing routes that already loaded.
- The map uses CARTO Positron (`light_all`) raster tiles with the public browser key from
  `NEXT_PUBLIC_CARTO_BASEMAP_KEY`. CARTO and OpenStreetMap attribution must remain visible. CARTO
  began requiring keys in August 2026; an unauthenticated `cartocdn.com` URL renders an
  "API key required" watermark.
- The CARTO key is intentionally visible in browser requests and must be restricted in CARTO's
  dashboard to `dly2k41m9jl34.cloudfront.net` and `strava-maksym.pages.dev`. The real value belongs
  only in gitignored `.env`; `.env.example` contains an empty placeholder.

## Current architecture

- Next.js 16 App Router application deployed through SST/OpenNext on AWS.
- Public AWS origin: `https://dly2k41m9jl34.cloudfront.net/`.
- Deployed SST stage: `maksym`; component: `MyWeb`; AWS region: `us-east-2`.
- Active Cloudflare Pages alias: `https://strava-maksym.pages.dev/`; it redirects all paths to
  the current CloudFront origin and was verified with an HTTP 302 followed by a successful 200.
- NextAuth v4 uses Strava OAuth with the `activity:read_all` scope.
- `app/api/activities/route.ts` is an authenticated same-origin proxy. It never exposes the Strava
  access token to the browser. It returns mapped runs, trail runs, and hikes plus `nextBefore` and
  `hasMore` pagination metadata.
- `ActivityExplorer` requests 10, then 10, then 200 at a time using the oldest raw activity's Unix
  timestamp as Strava's `before` cursor. The cursor must be computed before route/type filtering,
  or pages containing unmapped activities could create gaps.
- Strava returns athlete activities newest-first. The client still sorts merged mapped activities
  newest-first and deduplicates them by activity ID.
- `gym-maksym.pages.dev` is a Cloudflare Pages redirect project, not a Cloudflare-hosted
  Next.js deployment. Its `_redirects` file sends all paths to its AWS CloudFront origin.

## Completed priorities

1. Fix the broken/annoying Strava login.
2. Refresh Strava access tokens automatically so normal use does not require repeated login.
3. Add an unobtrusive, chronological activity list with individual activity details.
4. Improve map framing, loading/empty/error states, metadata, accessibility, and responsive UX.
5. Validate lint and production build.
6. Last: create/document a `strava-maksym.pages.dev` redirect project matching `gym_web`.

## Authentication and external requirements

- Strava's July 2026 developer onboarding requires a Strava subscription for API application
  access. If the API dashboard shows the subscriber-only access gate, it may hide the editable
  application fields and prevent OAuth until the account subscribes.
- The live NextAuth sign-in endpoint responds normally and uses
  `https://dly2k41m9jl34.cloudfront.net` as its callback base.
- The JWT stores the Strava access token, refresh token, and expiry. `lib/auth.ts` refreshes it five
  minutes before expiry. A refresh failure sets `RefreshAccessTokenError` and prompts reconnection.
- The Strava API application must have the exact active hostname in its Authorization Callback
  Domain. For the current AWS-hosted auth flow that is `dly2k41m9jl34.cloudfront.net` (hostname
  only, no scheme/path). A Pages redirect does not change the final browser hostname because it
  redirects to CloudFront.
- Strava dashboard: set **Authorization Callback Domain** to the hostname that actually handles
  `/api/auth/callback/strava` (currently `dly2k41m9jl34.cloudfront.net`).
- If Strava displays “We're updating API access to be subscriber-only,” start/maintain a Strava
  subscription before expecting the API application and OAuth flow to work.
- AWS/SST deployment environment must provide `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and
  `NEXTAUTH_SECRET`; `NEXTAUTH_URL` should be the CloudFront origin while Pages is only a redirect.
- Preserve the SST component name `MyWeb` and deploy to the original stage so the existing
  CloudFront hostname—and therefore the working Strava callback domain—remains stable.
- SST 3.17.23 generated only `lambda:InvokeFunctionUrl` for the public server Function URL. AWS
  now also requires `lambda:InvokeFunction` with `lambda:InvokedViaFunctionUrl=true`. That
  narrowly scoped permission was added to the deployed server function on 2026-07-11. Ordinary
  function updates preserve it; recreate/remove operations require rechecking it.
- Cloudflare Pages project `strava-maksym` is deployed from `pages-redirect/`. Future redirect
  changes can be published with
  `npx wrangler pages deploy pages-redirect --project-name strava-maksym --branch main`.

## Latest verification and deployment

- Performance implementation commit: `ddbeeab` (`Speed up progressive activity loading`).
- Latest code is deployed to the existing `maksym` SST stage and verified through
  `https://strava-maksym.pages.dev/` with HTTP 200 on 2026-07-19.
- Lint and the Node 20 production build passed. The machine's default Node 19 is too old for
  Next.js 16; use `/home/maksym/.nvm/versions/node/v20.20.2/bin` in `PATH`.
- AWS login can expire. Run `aws login`, then bridge its credentials for SST with
  `eval "$(aws configure export-credentials --format env)"` before `npm run deploy`.
- The host disables Ubuntu 24.04's extra AppArmor unprivileged-user-namespace restriction through
  `/etc/sysctl.d/60-apparmor-namespace.conf`, allowing Codex's Bubblewrap sandbox to work. Do not
  diagnose a manually launched nested `bwrap` inside Codex as a host failure: nested Bubblewrap is
  expected to lack network capabilities; test Bubblewrap directly from the normal shell instead.

## Resume checklist

1. Read this file and `README.md`.
2. Run `git status --short` and preserve unrelated user changes.
3. Install dependencies with `npm install` if `node_modules` is absent.
4. Run `npm run lint` and the production build with Node 20 before deployment.
5. Deploy AWS first, test login and refresh, then configure the Pages redirect last.
6. After changing progressive loading, verify that background pages never move map zoom/pan;
   geolocation controls the initial view and activity selection is the only route-fit action.
