import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from '#config/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan logging middleware with Winston
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Acquisition API is running!' });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
