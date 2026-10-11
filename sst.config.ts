/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "strava-web",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const requiredEnvironment = [
      "STRAVA_CLIENT_ID",
      "STRAVA_CLIENT_SECRET",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "NEXT_PUBLIC_CARTO_BASEMAP_KEY",
    ] as const;
    const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

    if (missingEnvironment.length > 0) {
      throw new Error(`Missing deployment environment: ${missingEnvironment.join(", ")}`);
    }

    // Keep the original SST logical name so deployments update the current
    // CloudFront application instead of creating a second one.
    const web = new sst.aws.Nextjs("MyWeb", {
      environment: {
        STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID!,
        STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET!,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
        NEXT_PUBLIC_CARTO_BASEMAP_KEY: process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY!,
      },
    });

    return { url: web.url };
  },
});
