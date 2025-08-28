export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    req.user = {
      id: 1,
      email: 'test@example.com',
      role: 'admin',
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
