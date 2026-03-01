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
  UPSTASH_REDIS_REST_URL: requireEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
};
