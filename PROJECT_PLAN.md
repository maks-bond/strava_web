# Strava Run Visualizer: Improvement and Deployment Plan

Last updated: 2026-07-11

## Current architecture

- Next.js 16 App Router application deployed through SST/OpenNext on AWS.
- Public AWS origin: `https://dly2k41m9jl34.cloudfront.net/`.
- Deployed SST stage: `maksym`; component: `MyWeb`; AWS region: `us-east-2`.
- Active Cloudflare Pages alias: `https://strava-maksym.pages.dev/`; it redirects all paths to
  the current CloudFront origin and was verified with an HTTP 302 followed by a successful 200.
- NextAuth v4 uses Strava OAuth with the `activity:read_all` scope.
- The home page fetches up to 200 recent Strava activities, keeps runs, trail runs,
  and hikes, then draws their summary polylines on a Leaflet map.
- `gym-maksym.pages.dev` is a Cloudflare Pages redirect project, not a Cloudflare-hosted
  Next.js deployment. Its `_redirects` file sends all paths to its AWS CloudFront origin.

## Requested priorities

1. Fix the broken/annoying Strava login.
2. Refresh Strava access tokens automatically so normal use does not require repeated login.
3. Add an unobtrusive, chronological activity list with individual activity details.
4. Improve map framing, loading/empty/error states, metadata, accessibility, and responsive UX.
5. Validate lint and production build.
6. Last: create/document a `strava-maksym.pages.dev` redirect project matching `gym_web`.

## Authentication diagnosis

- Strava's July 2026 developer onboarding requires a Strava subscription for API application
  access. If the API dashboard shows the subscriber-only access gate, it may hide the editable
  application fields and prevent OAuth until the account subscribes.
- The live NextAuth sign-in endpoint responds normally and uses
  `https://dly2k41m9jl34.cloudfront.net` as its callback base.
- The existing JWT stores the Strava refresh token and expiry but never refreshes an expired
  access token. Strava access tokens expire, so the current app eventually fetches no data and
  forces manual reauthorization.
- The Strava API application must have the exact active hostname in its Authorization Callback
  Domain. For the current AWS-hosted auth flow that is `dly2k41m9jl34.cloudfront.net` (hostname
  only, no scheme/path). A Pages redirect does not change the final browser hostname because it
  redirects to CloudFront.
- OAuth failures should be surfaced in the app with a useful retry/configuration message rather
  than appearing as an unexplained empty activity set.

## Implementation direction

- Refresh expired Strava tokens in the NextAuth JWT callback using Strava's token endpoint.
- Keep a long-lived encrypted NextAuth session cookie and pass only token status—not raw tokens—to
  UI components beyond what the server needs.
- Redirect directly to Strava from the custom sign-in page and provide friendly auth error UI.
- Return structured Strava fetch results so API/auth failures are distinguishable from no data.
- Add a compact activity drawer/list, newest first, with route selection and Strava links.
- Fit the map to activity bounds initially; geolocation should be optional and should not pull the
  user away from their routes.
- Add a `pages-redirect/` folder targeting the CloudFront origin and document Cloudflare setup.

## External configuration still required

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

## Resume checklist

1. Read this file and `README.md`.
2. Run `git status --short` and preserve unrelated user changes.
3. Install dependencies with `npm install` if `node_modules` is absent.
4. Run `npm run lint` and `npm run build` before deployment.
5. Deploy AWS first, test login and refresh, then configure the Pages redirect last.
