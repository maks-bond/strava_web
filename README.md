This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, ensure you have a `.env` file based on `.env.example` in the root directory:
```bash
cp .env.example .env
```
Update the `.env` file with your Strava API details and a random secret for NextAuth.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy to AWS

This project uses [SST](https://sst.dev) to deploy the Next.js application to AWS.

### Prerequisites

1.  **AWS Account**: You need an active AWS account.
2.  **AWS Credentials**: Configure your AWS credentials locally. You can do this via the AWS CLI:
    ```bash
    aws configure
    ```
    Or by setting the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
3.  **Environment Variables**: Ensure your `.env` file is populated. For production, you may need to update `NEXTAUTH_URL` to match your deployed domain.

### Deployment

To deploy the application to your personal development stage:

```bash
npx sst deploy
```

To deploy to production:

```bash
npx sst deploy --stage production
```

This will automatically build your Next.js application and provision the necessary AWS resources (CloudFront, S3, Lambda, etc.) to host it.

**Important**: After deployment, SST will output the URL of your application.
1.  Update the `NEXTAUTH_URL` in your `.env` file with this URL.
2.  Update the **Authorization Callback Domain** in your Strava API Application settings to match this domain.
3.  Redeploy if necessary (`npx sst deploy`).
