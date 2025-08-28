let nextId = 1;

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
};

mockDb.select.mockImplementation(() => ({
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

mockDb.insert.mockImplementation(() => ({
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockImplementation(() => Promise.resolve([{
    id: nextId++,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
  }])),
}));

export const db = mockDb;
export const sql = jest.fn();
