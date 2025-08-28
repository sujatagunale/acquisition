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

const router = express.Router();

router.get('/', getAllListings);
router.get('/my', authenticateToken, getMyListings);
router.get('/:id', getListingById);
router.post('/', authenticateToken, createListing);
router.put('/:id', authenticateToken, updateListing);
router.delete('/:id', authenticateToken, deleteListing);

export default router;
