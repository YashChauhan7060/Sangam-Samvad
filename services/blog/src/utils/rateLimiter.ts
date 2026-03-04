import { RateLimiter } from "./leakyBucket.js";

const rateLimiter = new RateLimiter({
  redisUrl: process.env.REDIS_URL as string,
  serviceName: "blog-service",
});

export const strictLimiter = rateLimiter.strictLimiter();
export const normalLimiter = rateLimiter.normalLimiter();
export const readLimiter   = rateLimiter.readLimiter();
export const writeLimiter  = rateLimiter.writeLimiter();