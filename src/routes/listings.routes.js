import express from 'express';
import { authenticateToken } from '#middlewares/auth.middleware.js';
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} from '#controllers/listings.controller.js';
import { rateLimitPerUser, sensitiveDetector } from '#config/arcjet.js';

const router = express.Router();

const listingLimiter = rateLimitPerUser();
const sensitive = sensitiveDetector();

router.get('/', getAllListings);
router.get('/my', authenticateToken, getMyListings);
router.get('/:id', getListingById);
router.post('/', authenticateToken, listingLimiter, sensitive, createListing);
router.put('/:id', authenticateToken, listingLimiter, sensitive, updateListing);
router.delete('/:id', authenticateToken, listingLimiter, deleteListing);

export default router;
