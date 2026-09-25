import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly TTL = {
    activeConversation: 300, // 5 minutes
    userOnline: 60, // 1 minute
    callSession: 600, // 10 minutes
  };

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      
      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis connection error, falling back to memory cache:', err.message);
        this.redis = null;
      });
    }
  }

  private async set(key: string, value: any, ttlSeconds: number) {
    if (this.redis) {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  private async get(key: string) {
    if (this.redis) {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } else {
      const item = this.memoryCache.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expiry) {
        this.memoryCache.delete(key);
        return null;
      }
      return item.value;
    }
  }

  async getActiveConversation(userId: string) {
    return this.get(`conversation:active:${userId}`);
  }

  async setActiveConversation(userId: string, conversation: any) {
    await this.set(
      `conversation:active:${userId}`,
      conversation,
      this.TTL.activeConversation
    );
  }

  async invalidateConversation(conversationId: string) {
    // Invalidate pattern match is complex in memory, so we'll just skip for now
    // or implement a simple scan if needed. For single instance, it's less critical.
    if (this.redis) {
      const pattern = `conversation:active:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data && JSON.parse(data).conversationId === conversationId) {
          await this.redis.del(key);
        }
      }
    } else {
      // Simple memory cleanup
      for (const [key, item] of this.memoryCache.entries()) {
        if (key.startsWith('conversation:active:') && item.value.conversationId === conversationId) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  async setUserOnline(userId: string) {
    await this.set(`user:online:${userId}`, '1', this.TTL.userOnline);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const val = await this.get(`user:online:${userId}`);
    return val === '1';
  }
}

export const cacheService = new CacheService();
