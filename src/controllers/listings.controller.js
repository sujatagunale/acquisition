import {
  createListingSchema,
  updateListingSchema,
  listingIdSchema,
} from '#validations/listings.validation.js';
import logger from '#config/logger.js';
import * as listingsService from '#services/listings.service.js';
import { formatValidationError } from '#utils/format.js';

export const getAllListings = async (req, res, next) => {
  try {
    logger.info('Fetching all listings');
    const allListings = await listingsService.getAllListings();

    res.json({
      message: 'Listings retrieved successfully',
      listings: allListings,
      count: allListings.length,
    });
  } catch (error) {
    logger.error('Error fetching listings:', error);
    next(error);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    const paramValidation = listingIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid listing ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid listing ID',
      });
    }

    const { id } = paramValidation.data;
    const listing = await listingsService.getListingById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    logger.info(`Listing retrieved: ${listing.id}`);
    res.json({
      message: 'Listing retrieved successfully',
      listing,
    });
  } catch (error) {
    logger.error('Error fetching listing:', error);
    next(error);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const bodyValidation = createListingSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Invalid listing data',
        details:
          formatValidationError(bodyValidation.error) || 'Invalid listing data',
      });
    }

    const createdListing = await listingsService.createListing(
      req.user.id,
      bodyValidation.data
    );

    logger.info(`Listing created: ${createdListing.id}`);
    res.status(201).json({
      message: 'Listing created successfully',
      listing: createdListing,
    });
  } catch (error) {
    logger.error('Error creating listing:', error);
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const paramValidation = listingIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid listing ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid listing ID',
      });
    }

    const { id } = paramValidation.data;

    const existingListing = await listingsService.getListingById(id);
    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (
      req.user.role !== 'admin' &&
      existingListing.seller_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bodyValidation = updateListingSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'No valid updates provided',
        details:
          formatValidationError(bodyValidation.error) ||
          'No valid updates provided',
      });
    }

    const updatedListing = await listingsService.updateListing(
      id,
      bodyValidation.data
    );

    if (!updatedListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    logger.info(`Listing updated: ${updatedListing.id}`);
    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing,
    });
  } catch (error) {
    logger.error('Error updating listing:', error);
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const paramValidation = listingIdSchema.safeParse({ id: req.params.id });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid listing ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid listing ID',
      });
    }

    const { id } = paramValidation.data;

    const existingListing = await listingsService.getListingById(id);
    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (
      req.user.role !== 'admin' &&
      existingListing.seller_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deletedListing = await listingsService.deleteListing(id);

    if (!deletedListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    logger.info(`Listing deleted: ${deletedListing.id}`);
    res.json({
      message: 'Listing deleted successfully',
      deletedListing: {
        id: deletedListing.id,
        title: deletedListing.title,
      },
    });
  } catch (error) {
    logger.error('Error deleting listing:', error);
    next(error);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const myListings = await listingsService.getListingsBySeller(req.user.id);

    res.json({
      message: 'Your listings retrieved successfully',
      listings: myListings,
      count: myListings.length,
    });
  } catch (error) {
    logger.error('Error fetching user listings:', error);
    next(error);
  }
};
