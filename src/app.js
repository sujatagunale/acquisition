import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import logger from '#config/logger.js';
import aj from '#config/arcjet.js';
import userRoutes from '#routes/users.routes.js';
import authRoutes from '#routes/auth.routes.js';
import listingsRoutes from '#routes/listings.routes.js';
import dealsRoutes from '#routes/deals.routes.js';
import errorMiddleware from '#middlewares/error.middleware.js';

const app = express();

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

app.use(async (req, res, next) => {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      return res.status(429).json({ error: 'Too Many Requests' });
    } else if (decision.reason.isBot()) {
      logger.warn(`Bot detected for IP: ${req.ip}`);
      return res.status(403).json({ error: 'Bot access denied' });
    } else if (decision.reason.isShield()) {
      logger.warn(`Shield protection triggered for IP: ${req.ip}`);
      return res
        .status(403)
        .json({ error: 'Request blocked by security shield' });
    } else {
      logger.warn(
        `Request denied for IP: ${req.ip}, reason: ${decision.reason}`
      );
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  next();
});

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
