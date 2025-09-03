import express from 'express';
import { authenticateToken, requireAdmin } from '#middlewares/auth.middleware.js';
import {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  acceptDeal,
  getDealsByListing,
} from '#controllers/deals.controller.js';
import { rateLimitPerUser, sensitiveDetector } from '#config/arcjet.js';

const router = express.Router();

const dealLimiter = rateLimitPerUser();
const sensitive = sensitiveDetector();

router.get('/', authenticateToken, requireAdmin, getAllDeals);
router.get('/:id', authenticateToken, getDealById);
router.post('/', authenticateToken, dealLimiter, sensitive, createDeal);
router.put('/:id', authenticateToken, dealLimiter, sensitive, updateDeal);
router.delete('/:id', authenticateToken, dealLimiter, deleteDeal);
router.post('/:id/accept', authenticateToken, dealLimiter, acceptDeal);
router.get('/listing/:listingId', authenticateToken, getDealsByListing);

export default router;
