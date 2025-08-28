// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

import { jest } from '@jest/globals';

jest.unstable_mockModule('#config/database.js', async () => {
  const bcrypt = await import('bcrypt');
  
  let nextId = 1;
  const mockUsers = new Map();

  const createMockUser = async (userData = {}) => {
    let hashedPassword;
    if (userData.password_hash) {
      hashedPassword = userData.password_hash;
    } else if (userData.password) {
      hashedPassword = await bcrypt.default.hash(userData.password, 12);
    } else {
      hashedPassword = await bcrypt.default.hash('password123', 12);
    }
    
    return {
      id: nextId++,
      name: userData.name || 'Test User',
      email: userData.email || 'test@example.com',
      password_hash: hashedPassword,
      role: userData.role || 'user',
      created_at: new Date(),
      updated_at: new Date(),
    };
  };

  const mockDb = {
    select: jest.fn((fields) => ({
      from: jest.fn((table) => ({
        where: jest.fn((condition) => ({
          limit: jest.fn(async (limitNum) => {
            const allUsers = Array.from(mockUsers.values());
            console.log('Mock DB: Available users:', allUsers.map(u => ({ id: u.id, email: u.email })));
            
            if (condition) {
              console.log('Mock DB: Condition object:', condition);
              
              let userId, email;
              
              if (condition.queryChunks && Array.isArray(condition.queryChunks)) {
                for (const chunk of condition.queryChunks) {
                  if (chunk && chunk.brand === undefined && chunk.value !== undefined) {
                    if (typeof chunk.value === 'number') {
                      userId = chunk.value;
                    } else if (typeof chunk.value === 'string' && chunk.value.includes('@')) {
                      email = chunk.value;
                    }
                  }
                }
              }
              
              if (userId === undefined && email === undefined) {
                if (typeof condition.right === 'number') {
                  userId = condition.right;
                } else if (condition.value !== undefined) {
                  userId = condition.value;
                } else if (condition.right && condition.right.value !== undefined) {
                  userId = condition.right.value;
                }
              }
              
              if (userId !== undefined) {
                const user = mockUsers.get(userId);
                if (user) {
                  console.log(`Mock DB: Found user with ID ${userId}:`, { id: user.id, email: user.email });
                  return [user];
                }
                console.log(`Mock DB: No user found with ID ${userId}`);
              }
              
              if (email !== undefined) {
                const user = Array.from(mockUsers.values()).find(u => u.email === email);
                if (user) {
                  console.log(`Mock DB: Found user with email ${email}:`, { id: user.id, email: user.email });
                  return [user];
                }
                console.log(`Mock DB: No user found with email ${email}`);
              }
            }
            
            console.log('Mock DB: No matching user found, returning empty array');
            return [];
          }),
        })),
        limit: jest.fn(async () => {
          const allUsers = Array.from(mockUsers.values());
          console.log('Mock DB: Returning all users for non-conditional query');
          return allUsers;
        }),
      })),
    })),
    
    insert: jest.fn((table) => ({
      values: jest.fn((userData) => ({
        returning: jest.fn(async (fields) => {
          const existingUser = Array.from(mockUsers.values()).find(u => u.email === userData.email);
          if (existingUser) {
            throw new Error('User with this email already exists');
          }
          
          const newUser = await createMockUser(userData);
          mockUsers.set(newUser.id, newUser);
          
          if (fields && typeof fields === 'object') {
            const result = {};
            Object.keys(fields).forEach(key => {
              result[key] = newUser[key];
            });
            return [result];
          }
          
          return [newUser];
        }),
      })),
    })),
    
    update: jest.fn((table) => ({
      set: jest.fn((updateData) => ({
        where: jest.fn((condition) => ({
          returning: jest.fn(async () => {
            if (condition) {
              let userId, email;
              
              if (condition.queryChunks && Array.isArray(condition.queryChunks)) {
                for (const chunk of condition.queryChunks) {
                  if (chunk && chunk.brand === undefined && chunk.value !== undefined) {
                    if (typeof chunk.value === 'number') {
                      userId = chunk.value;
                    } else if (typeof chunk.value === 'string' && chunk.value.includes('@')) {
                      email = chunk.value;
                    }
                  }
                }
              }
              
              if (userId === undefined && email === undefined) {
                if (typeof condition.right === 'number') {
                  userId = condition.right;
                } else if (condition.value !== undefined) {
                  userId = condition.value;
                } else if (condition.right && condition.right.value !== undefined) {
                  userId = condition.right.value;
                }
              }
              
              if (userId !== undefined) {
                const user = mockUsers.get(userId);
                if (user) {
                  const updatedUser = { ...user, ...updateData, updated_at: new Date() };
                  mockUsers.set(userId, updatedUser);
                  return [updatedUser];
                }
              }
              
              if (email !== undefined) {
                const user = Array.from(mockUsers.values()).find(u => u.email === email);
                if (user) {
                  const updatedUser = { ...user, ...updateData, updated_at: new Date() };
                  mockUsers.set(user.id, updatedUser);
                  return [updatedUser];
                }
              }
            }
            return [];
          }),
        })),
      })),
    })),
    
    delete: jest.fn((table) => ({
      where: jest.fn((condition) => ({
        returning: jest.fn(async () => {
          if (condition) {
            let userId, email;
            
            if (condition.queryChunks && Array.isArray(condition.queryChunks)) {
              for (const chunk of condition.queryChunks) {
                if (chunk && chunk.brand === undefined && chunk.value !== undefined) {
                  if (typeof chunk.value === 'number') {
                    userId = chunk.value;
                  } else if (typeof chunk.value === 'string' && chunk.value.includes('@')) {
                    email = chunk.value;
                  }
                }
              }
            }
            
            if (userId === undefined && email === undefined) {
              if (typeof condition.right === 'number') {
                userId = condition.right;
              } else if (condition.value !== undefined) {
                userId = condition.value;
              } else if (condition.right && condition.right.value !== undefined) {
                userId = condition.right.value;
              }
            }
            
            if (userId !== undefined) {
              const user = mockUsers.get(userId);
              if (user) {
                mockUsers.delete(userId);
                return [user];
              }
            }
            
            if (email !== undefined) {
              const user = Array.from(mockUsers.values()).find(u => u.email === email);
              if (user) {
                mockUsers.delete(user.id);
                return [user];
              }
            }
          }
          return [];
        }),
      })),
    })),
  };

  return {
    db: mockDb,
    sql: jest.fn(),
  };
});

jest.unstable_mockModule('#middlewares/auth.middleware.js', async () => {
  return {
    authenticateToken: (req, res, next) => {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      try {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
          };
          console.log('Auth middleware - decoded user:', req.user);
        } catch (error) {
          req.user = {
            id: 1,
            email: 'usertest@example.com',
            role: 'user',
          };
          console.log('Auth middleware - fallback user due to decode error:', error.message);
        }
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    },
    requireRole: (roles) => {
      return (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
      };
    },
    requireAdmin: (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    },
  };
});
