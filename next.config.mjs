/** @type {import('next').NextConfig} */
const nextConfig = {
  // Amplify WEB_COMPUTE (Lambda SSR) ne forward pas automatiquement les env vars
  // non-NEXT_PUBLIC_ au runtime. On les inline explicitement au build.
  env: {
    TESLA_CLIENT_ID:      process.env.TESLA_CLIENT_ID,
    TESLA_CLIENT_SECRET:  process.env.TESLA_CLIENT_SECRET,
    TESLA_AUDIENCE:       process.env.TESLA_AUDIENCE,
    TESLA_REFRESH_TOKEN:  process.env.TESLA_REFRESH_TOKEN,
    TESLA_VEHICLE_VIN:    process.env.TESLA_VEHICLE_VIN,
    ADMIN_SECRET_TOKEN:   process.env.ADMIN_SECRET_TOKEN,
    NEXT_PUBLIC_ADMIN_TOKEN: process.env.NEXT_PUBLIC_ADMIN_TOKEN,
    APP_REGION:           process.env.APP_REGION,
    DYNAMODB_TABLE:       process.env.DYNAMODB_TABLE,
    STRIPE_SECRET_KEY:    process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'groupeb-storage.s3.ca-central-1.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'static-assets.tesla.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
