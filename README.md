This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

## Persistent Storage with Vercel KV

This application uses [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Redis) for persistent storage of upload statuses and other data that needs to be shared across serverless functions and deployments.

### Setting Up Vercel KV

1. If you're deploying on Vercel, you can add the KV storage from the Vercel dashboard:
   - Go to your project on Vercel
   - Navigate to the "Storage" tab
   - Select "Connect" for KV database
   - Follow the setup instructions

2. Set the following environment variables:
   ```
   KV_URL=your_vercel_kv_url
   KV_REST_API_URL=your_vercel_kv_rest_api_url
   KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token
   ```

3. For local development:
   - Copy the environment variables from your Vercel project
   - Add them to your `.env.local` file

### Fallback Implementation

For local development without Vercel KV, the application uses a fallback in-memory implementation. This is automatically activated when the KV environment variables are not set.

**Note:** The fallback implementation is not recommended for production as data will not persist between server restarts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
