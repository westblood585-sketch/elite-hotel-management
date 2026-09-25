import { Socket } from 'socket.io';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second
});

export const socketRateLimitMiddleware = async (
  socket: Socket,
  eventName: string,
  next: Function
) => {
  const userId = socket.data.user?.userId;
  
  if (!userId) {
    return next(new Error('Unauthorized'));
  }

  console.log(`[RateLimit] Processing event: ${eventName} for user: ${userId}`);

  try {
    await rateLimiter.consume(userId);
    console.log(`[RateLimit] User ${userId} permitted for ${eventName}`);
    next();
  } catch (error) {
    socket.emit('rate_limit_exceeded', {
      message: 'Too many requests. Please slow down.',
    });
    console.warn(`[Rate Limit] User ${userId} exceeded limit`);
  }
};
