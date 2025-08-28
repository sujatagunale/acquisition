import express from 'express';
import logger from '#config/logger.js';

const router = express.Router();

// GET /users - Get all users
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all users');
    res.json({ message: 'Users endpoint - absolute imports working!' });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
