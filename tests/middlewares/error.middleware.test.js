import errorMiddleware from '../../src/middlewares/error.middleware.js';

jest.mock('../../src/config/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/api/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle ValidationError', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed',
      details: 'Email is required'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: 'Email is required'
    });
  });

  it('should handle ValidationError without details', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: 'Validation failed'
    });
  });

  it('should handle UnauthorizedError', () => {
    const error = {
      name: 'UnauthorizedError',
      message: 'Access denied'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Access denied'
    });
  });

  it('should handle ForbiddenError', () => {
    const error = {
      name: 'ForbiddenError',
      message: 'Insufficient permissions'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  });

  it('should handle generic errors with custom status', () => {
    const error = {
      name: 'CustomError',
      message: 'Something went wrong',
      status: 422
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  });

  it('should handle generic errors without status (default to 500)', () => {
    const error = {
      name: 'GenericError',
      message: 'Something went wrong'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  });

  it('should hide error message in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = {
      name: 'GenericError',
      message: 'Sensitive error information'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong'
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should show error message in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = {
      name: 'GenericError',
      message: 'Detailed error information'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Detailed error information'
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle errors without message', () => {
    const error = {
      name: 'GenericError'
    };

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  });

  it('should handle Error objects', () => {
    const error = new Error('Standard error message');

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Standard error message'
    });
  });
});
