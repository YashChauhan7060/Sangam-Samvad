import { createClient, RedisClientType } from "redis";
import { Request, Response, NextFunction } from "express";

export interface LeakyBucketOptions {
  bucketCapacity: number;
  leakRate: number;
  windowInSeconds: number;
  keyPrefix?: string;
}

export interface RateLimiterConfig {
  redisUrl: string;
  serviceName: string;
}

export class RateLimiter {
  private redisClient: RedisClientType;
  private serviceName: string;
  private isConnected: boolean = false;

  constructor(config: RateLimiterConfig) {
    this.serviceName = config.serviceName;

    this.redisClient = createClient({
      url: config.redisUrl,
    }) as RedisClientType;

    this.redisClient.on("error", (err) => {
      console.error(`[${this.serviceName}] RateLimiter Error:`, err.message);
      this.isConnected = false;
    });

    this.redisClient.on("connect", () => {
      console.log(`[${this.serviceName}] ✅ RateLimiter connected to Redis`);
      this.isConnected = true;
    });

    this.redisClient.connect().catch((err) => {
      console.error(`[${this.serviceName}] RateLimiter connect failed:`, err.message);
    });
  }

  createLimiter(options: LeakyBucketOptions) {
    const {
      bucketCapacity,
      leakRate,
      windowInSeconds,
      keyPrefix = "leaky",
    } = options;

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {

      // Redis down = fail open, never block users
      if (!this.isConnected) {
        next();
        return;
      }

      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const bucketKey    = `${keyPrefix}:${this.serviceName}:${ip}:${req.path}`;
      const timestampKey = `${keyPrefix}_time:${this.serviceName}:${ip}:${req.path}`;

      try {
        const now = Date.now();

        const [currentCount, lastLeakTime] = await Promise.all([
          this.redisClient.get(bucketKey),
          this.redisClient.get(timestampKey),
        ]);

        let count      = parseInt(currentCount || "0");
        const lastLeak = parseInt(lastLeakTime || `${now}`);

        // ── LEAKY BUCKET CORE ──────────────────────
        // 1. How much time passed since last request?
        const timePassed    = (now - lastLeak) / 1000;
        const leakPerSecond = leakRate / windowInSeconds;

        // 2. Calculate how many requests leaked out
        const leaked = Math.floor(timePassed * leakPerSecond);

        // 3. Drain the bucket
        count = Math.max(0, count - leaked);

        // 4. Bucket full → reject request
        if (count >= bucketCapacity) {
          const retryAfter = Math.ceil(
            (count - bucketCapacity + 1) / leakPerSecond
          );
          res.setHeader("Retry-After", retryAfter);
          res.setHeader("X-RateLimit-Limit", bucketCapacity);
          res.setHeader("X-RateLimit-Remaining", "0");
          res.setHeader("X-RateLimit-Service", this.serviceName);

          res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down.",
            retryAfter: `${retryAfter} seconds`,
            service: this.serviceName,
          });
          return;
        }

        // 5. Allow request → add to bucket
        count += 1;

        // 6. Save updated state to Redis
        await Promise.all([
          this.redisClient.set(
            bucketKey,
            count.toString(),
            { EX: windowInSeconds * 2 }
          ),
          this.redisClient.set(
            timestampKey,
            now.toString(),
            { EX: windowInSeconds * 2 }
          ),
        ]);

        res.setHeader("X-RateLimit-Limit", bucketCapacity);
        res.setHeader("X-RateLimit-Remaining", bucketCapacity - count);
        res.setHeader("X-RateLimit-Service", this.serviceName);

        next();

      } catch (error) {
        // Never block on rate limiter error
        console.error(`[${this.serviceName}] Rate limiter error:`, error);
        next();
      }
    };
  }

  strictLimiter() {
    return this.createLimiter({
      bucketCapacity: 5,
      leakRate: 5,
      windowInSeconds: 60,
      keyPrefix: "strict",
    });
  }

  normalLimiter() {
    return this.createLimiter({
      bucketCapacity: 30,
      leakRate: 30,
      windowInSeconds: 60,
      keyPrefix: "normal",
    });
  }

  readLimiter() {
    return this.createLimiter({
      bucketCapacity: 100,
      leakRate: 100,
      windowInSeconds: 60,
      keyPrefix: "read",
    });
  }

  writeLimiter() {
    return this.createLimiter({
      bucketCapacity: 10,
      leakRate: 10,
      windowInSeconds: 60,
      keyPrefix: "write",
    });
  }

  async disconnect(): Promise<void> {
    await this.redisClient.disconnect();
  }
}