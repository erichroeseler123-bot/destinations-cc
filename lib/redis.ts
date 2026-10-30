import { Redis } from "@upstash/redis";

const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

export const redis =
  url &&
  token &&
  /^https?:\/\//i.test(url) &&
  !url.includes("[SENSITIVE]") &&
  !token.includes("[SENSITIVE]")
    ? new Redis({
        url,
        token,
      })
    : null;

