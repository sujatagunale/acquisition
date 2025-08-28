import {
  createDealSchema,
  updateDealSchema,
  dealIdSchema,
  acceptDealSchema,
} from '#validations/deals.validation.js';
import logger from '#config/logger.js';
import * as dealsService from '#services/deals.service.js';
import * as listingsService from '#services/listings.service.js';
import { formatValidationError } from '#utils/format.js';

export const getAllDeals = async (req, res, next) => {
  try {
    logger.info('Fetching all deals');
    const allDeals = await dealsService.getAllDeals();

    res.json({
      message: 'Deals retrieved successfully',
      deals: allDeals,
      count: allDeals.length,
    });
  } catch (error) {
    logger.error('Error fetching deals:', error);
    next(error);
  }
};

export const getDealById = async (req, res, next) => {
  try {
    const paramValidation = dealIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid deal ID',
      });
    }

    const { id } = paramValidation.data;
    const deal = await dealsService.getDealById(id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (
      req.user.role !== 'admin' &&
      deal.buyer_id !== req.user.id &&
      deal.seller_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    logger.info(`Deal retrieved: ${deal.id}`);
    res.json({
      message: 'Deal retrieved successfully',
      deal,
    });
  } catch (error) {
    logger.error('Error fetching deal:', error);
    next(error);
  }
};

export const createDeal = async (req, res, next) => {
  try {
    const bodyValidation = createDealSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Invalid deal data',
        details:
          formatValidationError(bodyValidation.error) || 'Invalid deal data',
      });
    }

    const listing = await listingsService.getListingById(
      bodyValidation.data.listing_id
    );
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'listed') {
      return res
        .status(400)
        .json({ error: 'Listing is not available for deals' });
    }

    if (listing.seller_id === req.user.id) {
      return res
        .status(400)
        .json({ error: 'Cannot create deal on your own listing' });
    }

    const createdDeal = await dealsService.createDeal(
      req.user.id,
      bodyValidation.data
    );

    logger.info(`Deal created: ${createdDeal.id}`);
    res.status(201).json({
      message: 'Deal created successfully',
      deal: createdDeal,
    });
  } catch (error) {
    logger.error('Error creating deal:', error);
    next(error);
  }
};

export const updateDeal = async (req, res, next) => {
  try {
    const paramValidation = dealIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid deal ID',
      });
    }

    const { id } = paramValidation.data;

    const existingDeal = await dealsService.getDealById(id);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role !== 'admin' && existingDeal.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existingDeal.status !== 'pending') {
      return res.status(400).json({ error: 'Can only update pending deals' });
    }

    const bodyValidation = updateDealSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'No valid updates provided',
        details:
          formatValidationError(bodyValidation.error) ||
          'No valid updates provided',
      });
    }

    const updatedDeal = await dealsService.updateDeal(id, bodyValidation.data);

    if (!updatedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    logger.info(`Deal updated: ${updatedDeal.id}`);
    res.json({
      message: 'Deal updated successfully',
      deal: updatedDeal,
    });
  } catch (error) {
    logger.error('Error updating deal:', error);
    next(error);
  }
};

export const deleteDeal = async (req, res, next) => {
  try {
    const paramValidation = dealIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid deal ID',
      });
    }

    const { id } = paramValidation.data;

    const existingDeal = await dealsService.getDealById(id);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role !== 'admin' && existingDeal.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deletedDeal = await dealsService.deleteDeal(id);

    if (!deletedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    logger.info(`Deal deleted: ${deletedDeal.id}`);
    res.json({
      message: 'Deal deleted successfully',
      deletedDeal: {
        id: deletedDeal.id,
        amount: deletedDeal.amount,
      },
    });
  } catch (error) {
    logger.error('Error deleting deal:', error);
    next(error);
  }
};

export const acceptDeal = async (req, res, next) => {
  try {
    const paramValidation = acceptDealSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid deal ID',
      });
    }

    const { id } = paramValidation.data;

    const acceptedDeal = await dealsService.acceptDeal(id, req.user.id);

    logger.info(`Deal accepted: ${acceptedDeal.id}`);
    res.json({
      message:
        'Deal accepted successfully. Other deals for this listing have been cancelled.',
      deal: acceptedDeal,
    });
  } catch (error) {
    logger.error('Error accepting deal:', error);

    if (error.message === 'Deal not found') {
      return res.status(404).json({ error: 'Deal not found' });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (error.message === 'Deal is not in pending status') {
      return res.status(400).json({ error: 'Deal is not in pending status' });
    }

    next(error);
  }
};

export const getDealsByListing = async (req, res, next) => {
  try {
    const paramValidation = dealIdSchema.safeParse({
      id: req.params.listingId,
    });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid listing ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid listing ID',
      });
    }

    const { id: listingId } = paramValidation.data;

    const listing = await listingsService.getListingById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // if (req.user.role !== 'admin' && listing.seller_id !== req.user.id) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    const listingDeals = await dealsService.getDealsByListing(listingId);

    res.json({
      message: 'Deals for listing retrieved successfully',
      deals: listingDeals,
      count: listingDeals.length,
    });
  } catch (error) {
    logger.error('Error fetching deals by listing:', error);
    next(error);
  }
};
