import NodeCache from 'node-cache'

/**
 * Cache service for roomService
 * TTL: 5 minutes (300 seconds)
 * Check period: 120 seconds
 */
class CacheService {
  private cache: NodeCache

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // For better performance, don't clone objects
    })
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl)
    }
    return this.cache.set(key, value)
  }

  del(key: string | string[]): number {
    return this.cache.del(key)
  }

  flush(): void {
    this.cache.flushAll()
  }

  // Helper to invalidate all room-related caches
  invalidateRoomCaches(): void {
    const keys = this.cache.keys()
    const roomKeys = keys.filter(
      (key) => key.startsWith('room:') || key.startsWith('rooms:')
    )
    if (roomKeys.length > 0) {
      this.cache.del(roomKeys)
    }
  }

  // Get statistics
  getStats() {
    return this.cache.getStats()
  }
}

export const cacheService = new CacheService()
