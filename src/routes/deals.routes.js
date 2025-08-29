import express from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '#middlewares/auth.middleware.js';
import {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  acceptDeal,
  getDealsByListing,
} from '#controllers/deals.controller.js';
import {
  financialProtection,
  dealProtection,
} from '#middlewares/arcjet.middleware.js';

const router = express.Router();

const dealMiddleware = dealProtection 
  ? financialProtection 
  : (req, res, next) => next();

router.use(dealMiddleware);

router.get('/', authenticateToken, requireAdmin, getAllDeals);
router.get('/:id', authenticateToken, getDealById);
router.post('/', authenticateToken, createDeal);
router.put('/:id', authenticateToken, updateDeal);
router.delete('/:id', authenticateToken, deleteDeal);
router.post('/:id/accept', authenticateToken, acceptDeal);
router.get('/listing/:listingId', authenticateToken, getDealsByListing);

export default router;
