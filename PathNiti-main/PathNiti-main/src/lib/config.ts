// Application configuration
const appConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "PathNiti",
    description:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
      "One-Stop Personalized Career & Education Advisor for Indian Students",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  features: {
    enableGoogleAuth: true,
    enableEmailAuth: true,
    enableNotifications: true,
  },
} as const;

export const config = appConfig;
export default appConfig;
