import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
}

@Injectable()
export class CacheService implements ICacheService, OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private memoryStore = new Map<string, { value: any; expiresAt?: number }>();
  private isRedisActive = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;
    const redisEnabled = this.configService.get<string>('REDIS_ENABLED', 'false') === 'true';

    if (redisEnabled && redisHost) {
      try {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null, // Không spam retry nếu không có Redis
        });

        await this.redisClient.connect();
        this.isRedisActive = true;
        this.logger.log(`✅ Kết nối Redis thành công tại ${redisHost}:${redisPort}`);
      } catch (err: any) {
        this.logger.warn(`⚠️ Không thể kết nối Redis (${err.message}). Tự động kích hoạt In-Memory Cache mode.`);
        this.isRedisActive = false;
        this.redisClient = null;
      }
    } else {
      this.logger.log('💡 Chế độ In-Memory Cache đang được sử dụng (Không yêu cầu cài đặt Redis).');
    }

    // Dọn dẹp key hết hạn trong bộ nhớ định kỳ mỗi 60 giây
    setInterval(() => this.cleanupMemoryStore(), 60000);
  }

  private cleanupMemoryStore() {
    const now = Date.now();
    for (const [key, item] of this.memoryStore.entries()) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisActive && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        // Fallback to memory if Redis query fails
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.isRedisActive && this.redisClient) {
      try {
        const str = JSON.stringify(value);
        if (ttlSeconds) {
          await this.redisClient.set(key, str, 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, str);
        }
        return;
      } catch {
        // Fallback to memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {}
    }
    this.memoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isRedisActive && this.redisClient) {
      try {
        return await this.redisClient.incr(key);
      } catch {}
    }

    const current = (await this.get<number>(key)) || 0;
    const next = current + 1;
    await this.set(key, next);
    return next;
  }
}
