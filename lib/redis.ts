import { Redis } from "@upstash/redis";

function getRedisCredentials() {
  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

export function isRedisConfigured() {
  return getRedisCredentials() !== null;
}

export function getRedisClient() {
  const credentials = getRedisCredentials();

  if (!credentials) {
    throw new Error(
      "Redis is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  return new Redis(credentials);
}
