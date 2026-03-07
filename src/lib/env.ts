function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  DIRECT_URL: process.env.DIRECT_URL,
  // Optional — rate limiting is disabled if not configured
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};

