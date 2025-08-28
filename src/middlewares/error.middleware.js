import logger from '#config/logger.js';

const errorMiddleware = (err, req, res, _next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details || err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};

export default errorMiddleware;
