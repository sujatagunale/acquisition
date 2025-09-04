import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import logger from '#config/logger.js';
import userRoutes from '#routes/users.routes.js';
import authRoutes from '#routes/auth.routes.js';
import listingsRoutes from '#routes/listings.routes.js';
import dealsRoutes from '#routes/deals.routes.js';
import errorMiddleware from '#middlewares/error.middleware.js';
import ratelimitMiddleware from '#middlewares/ratelimit.middleware.js';
import geolocationMiddleware from '#middlewares/geolocation.middleware.js';
import botProtectionMiddleware from '#middlewares/bot-protection.middleware.js';
import shieldWafMiddleware from '#middlewares/shield-waf.middleware.js';

const app = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

app.use(geolocationMiddleware);
app.use(shieldWafMiddleware);
app.use(botProtectionMiddleware);
app.use(ratelimitMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Acquisition API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/deals', dealsRoutes);

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
