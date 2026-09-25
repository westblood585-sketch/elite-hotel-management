import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;



// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests, please try again later.'
// });
// app.use(limiter);

// Service routes
const services = [
  { path: '/api/auth', target: process.env.AUTH_API_BASE_URL || 'http://localhost:4001' },
  { path: '/api/users', target: process.env.USER_API_BASE_URL || 'http://localhost:4002' },
  { path: '/api/rooms', target: process.env.ROOM_API_BASE_URL || 'http://localhost:4003' },
  { path: '/api/guests', target: process.env.GUEST_API_BASE_URL || 'http://localhost:4004' },
  { path: '/api/reservations', target: process.env.RESERVATION_API_BASE_URL || 'http://localhost:4005' },
  { path: '/api/payments', target: process.env.PAYMENT_API_BASE_URL || 'http://localhost:4006' },
  { path: '/api/billing', target: process.env.BILLING_API_BASE_URL || 'http://localhost:4007' },
  { path: '/api/housekeeping', target: process.env.HOUSEKEEPING_API_BASE_URL || 'http://localhost:4008' },
  { path: '/api/communication', target: process.env.COMMUNICATION_API_BASE_URL || 'http://localhost:4009' },
  { path: '/api/notifications', target: process.env.NOTIFICATION_API_BASE_URL || 'http://localhost:4010' },
];

// Setup proxy middleware for each service
services.forEach(({ path, target }) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
      on: {
        error: (err, req, res) => {
          console.error(`Proxy error for ${path}:`, err.message);
          (res as express.Response).status(502).json({ 
            success: false, 
            message: 'Service unavailable' 
          });
        }
      }
    })
  );
  console.log(`✓ ${path} -> ${target}`);
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    success: true, 
    message: 'API Gateway is running',
    services: services.map(s => s.path)
  });
});

// Root
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    success: true, 
    message: 'Elite Hotel API Gateway',
    endpoints: services.map(s => s.path)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
