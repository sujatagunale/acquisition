import * as usersService from '../../src/services/users.service.js';

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

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const users = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(users),
      });

      const result = await usersService.getAllUsers();

      expect(result).toEqual(users);
      expect(db.select).toHaveBeenCalledWith({
        id: expect.any(Object),
        name: expect.any(Object),
        email: expect.any(Object),
        role: expect.any(Object),
        created_at: expect.any(Object),
        updated_at: expect.any(Object),
      });
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(usersService.getAllUsers()).rejects.toThrow(
        'Database error'
      );
    });

    it('should return empty array when no users exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await usersService.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    const userId = 1;
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return user by ID successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([user]),
          }),
        }),
      });

      const result = await usersService.getUserById(userId);

      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await usersService.getUserById(userId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await expect(usersService.getUserById(userId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateUser', () => {
    const userId = 1;
    const updates = {
      name: 'John Updated',
      email: 'john.updated@example.com',
    };
    const updatedUser = {
      id: 1,
      name: 'John Updated',
      email: 'john.updated@example.com',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should update user successfully', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await usersService.updateUser(userId, updates);

      expect(result).toEqual(updatedUser);
      expect(db.update).toHaveBeenCalled();
    });

    it('should include updated_at timestamp in update data', async () => {
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedUser]),
        }),
      });

      db.update.mockReturnValue({
        set: setMock,
      });

      await usersService.updateUser(userId, updates);

      expect(setMock).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(Date),
      });
    });

    it('should return null when user not found', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await usersService.updateUser(userId, updates);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await expect(usersService.updateUser(userId, updates)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle empty updates object', async () => {
      const emptyUpdates = {};

      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await usersService.updateUser(userId, emptyUpdates);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    const userId = 1;
    const deletedUser = {
      id: 1,
      email: 'john@example.com',
    };

    it('should delete user successfully', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedUser]),
        }),
      });

      const result = await usersService.deleteUser(userId);

      expect(result).toEqual(deletedUser);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await usersService.deleteUser(userId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await expect(usersService.deleteUser(userId)).rejects.toThrow(
        'Database error'
      );
    });

    it('should return only id and email fields', async () => {
      const fullDeletedUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([fullDeletedUser]),
        }),
      });

      const result = await usersService.deleteUser(userId);

      expect(result).toEqual(fullDeletedUser);

      const returningMock = db.delete().where().returning;
      expect(returningMock).toHaveBeenCalledWith({
        id: expect.any(Object),
        email: expect.any(Object),
      });
    });
  });
});
