import { db } from '#config/database.js';
import { listings } from '#models/listings.model.js';
import { eq } from 'drizzle-orm';
import logger from '#config/logger.js';

export async function getAllListings() {
  try {
    const allListings = await db.select().from(listings);
    return allListings;
  } catch (error) {
    logger.error('Error fetching all listings:', error);
    throw error;
  }
}

export async function getListingById(id) {
  try {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    return listing || null;
  } catch (error) {
    logger.error('Error fetching listing by ID:', error);
    throw error;
  }
}

export async function createListing(sellerId, listingData) {
  try {
    const newListing = {
      ...listingData,
      seller_id: sellerId,
      updated_at: new Date(),
    };
    const [createdListing] = await db
      .insert(listings)
      .values(newListing)
      .returning();
    return createdListing;
  } catch (error) {
    logger.error('Error creating listing:', error);
    throw error;
  }
}

export async function updateListing(id, updates) {
  try {
    const updateData = { ...updates, updated_at: new Date() };
    const [updatedListing] = await db
      .update(listings)
      .set(updateData)
      .where(eq(listings.id, id))
      .returning();
    return updatedListing || null;
  } catch (error) {
    logger.error('Error updating listing:', error);
    throw error;
  }
}

export async function deleteListing(id) {
  try {
    const [deletedListing] = await db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning();
    return deletedListing || null;
  } catch (error) {
    logger.error('Error deleting listing:', error);
    throw error;
  }
}

export async function getListingsBySeller(sellerId) {
  try {
    const sellerListings = await db
      .select()
      .from(listings)
      .where(eq(listings.seller_id, sellerId));
    return sellerListings;
  } catch (error) {
    logger.error('Error fetching listings by seller:', error);
    throw error;
  }
}
