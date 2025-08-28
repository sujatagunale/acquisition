import * as authService from '../../src/services/auth.service.js';

jest.mock('../../src/config/database.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
  sql: jest.fn(),
}));

jest.mock('../../src/config/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword123';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      const result = await authService.hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should throw error when bcrypt fails', async () => {
      const password = 'testpassword';
      
      bcrypt.hash.mockRejectedValue(new Error('Bcrypt error'));
      
      await expect(authService.hashPassword(password)).rejects.toThrow('Password hashing failed');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword';
      const hash = 'hashedpassword123';
      
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await authService.comparePassword(password, hash);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword';
      const hash = 'hashedpassword123';
      
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await authService.comparePassword(password, hash);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should throw error when bcrypt fails', async () => {
      const password = 'testpassword';
      const hash = 'hashedpassword123';
      
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));
      
      await expect(authService.comparePassword(password, hash)).rejects.toThrow('Password comparison failed');
    });
  });

  describe('createUser', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    };

    it('should create user successfully', async () => {
      const hashedPassword = 'hashedpassword123';
      const newUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date()
      };

      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      bcrypt.hash.mockResolvedValue(hashedPassword);

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newUser])
        })
      });

      const result = await authService.createUser(userData);

      expect(result).toEqual(newUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should throw error if user already exists', async () => {
      const existingUser = { id: 1, email: 'john@example.com' };

      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingUser])
          })
        })
      });

      await expect(authService.createUser(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should use default role when not provided', async () => {
      const userDataWithoutRole = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      const hashedPassword = 'hashedpassword123';
      const newUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date()
      };

      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      bcrypt.hash.mockResolvedValue(hashedPassword);

      const insertMock = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newUser])
        })
      };
      db.insert.mockReturnValue(insertMock);

      const result = await authService.createUser(userDataWithoutRole);

      expect(result).toEqual(newUser);
      expect(insertMock.values).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'user'
      });
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(authService.createUser(userData)).rejects.toThrow('Database error');
    });
  });

  describe('authenticateUser', () => {
    const email = 'john@example.com';
    const password = 'password123';
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123',
      role: 'user'
    };

    it('should authenticate user successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user])
          })
        })
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.authenticateUser(email, password);

      expect(result).toEqual(user);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should throw error if user not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user])
          })
        })
      });

      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Invalid credentials');
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Database error');
    });

    it('should handle bcrypt errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user])
          })
        })
      });

      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.authenticateUser(email, password)).rejects.toThrow('Bcrypt error');
    });
  });
});
