import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';

export const setupRedisAdapter = async (io: Server) => {
  const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  console.log('✅ Redis adapter initialized for Socket.IO');
};
