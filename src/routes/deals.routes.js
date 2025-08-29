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
  apiRateLimit,
  sensitiveDataShield,
  handleArcjetResponse,
} from '#middlewares/arcjet.middleware.js';

const router = express.Router();

router.use(handleArcjetResponse(apiRateLimit));
router.use(handleArcjetResponse(sensitiveDataShield));

router.get('/', authenticateToken, requireAdmin, getAllDeals);
router.get('/:id', authenticateToken, getDealById);
router.post('/', authenticateToken, createDeal);
router.put('/:id', authenticateToken, updateDeal);
router.delete('/:id', authenticateToken, deleteDeal);
router.post('/:id/accept', authenticateToken, acceptDeal);
router.get('/listing/:listingId', authenticateToken, getDealsByListing);

export default router;
