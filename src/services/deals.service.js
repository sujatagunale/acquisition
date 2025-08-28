import { db } from '#config/database.js';
import { deals } from '#models/deals.model.js';
import { listings } from '#models/listings.model.js';
import { eq, and, ne } from 'drizzle-orm';
import logger from '#config/logger.js';

export async function getAllDeals() {
  try {
    const allDeals = await db.select().from(deals);
    return allDeals;
  } catch (error) {
    logger.error('Error fetching all deals:', error);
    throw error;
  }
}

export async function getDealById(id) {
  try {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
    return deal || null;
  } catch (error) {
    logger.error('Error fetching deal by ID:', error);
    throw error;
  }
}

export async function createDeal(buyerId, dealData) {
  try {
    const [listing] = await db.select().from(listings).where(eq(listings.id, dealData.listing_id)).limit(1);
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    const newDeal = { 
      ...dealData, 
      buyer_id: buyerId, 
      seller_id: listing.seller_id,
      updated_at: new Date() 
    };
    const [createdDeal] = await db.insert(deals).values(newDeal).returning();
    return createdDeal;
  } catch (error) {
    logger.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(id, updates) {
  try {
    const updateData = { ...updates, updated_at: new Date() };
    const [updatedDeal] = await db.update(deals)
      .set(updateData)
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal || null;
  } catch (error) {
    logger.error('Error updating deal:', error);
    throw error;
  }
}

export async function deleteDeal(id) {
  try {
    const [deletedDeal] = await db.delete(deals)
      .where(eq(deals.id, id))
      .returning();
    return deletedDeal || null;
  } catch (error) {
    logger.error('Error deleting deal:', error);
    throw error;
  }
}

export async function getDealsByListing(listingId) {
  try {
    const listingDeals = await db.select().from(deals).where(eq(deals.listing_id, listingId));
    return listingDeals;
  } catch (error) {
    logger.error('Error fetching deals by listing:', error);
    throw error;
  }
}

export async function acceptDeal(dealId, sellerId) {
  try {
    return await db.transaction(async (tx) => {
      const [dealToAccept] = await tx.select().from(deals).where(eq(deals.id, dealId)).limit(1);
      
      if (!dealToAccept) {
        throw new Error('Deal not found');
      }
      
      if (dealToAccept.seller_id !== sellerId) {
        throw new Error('Access denied');
      }
      
      if (dealToAccept.status !== 'pending') {
        throw new Error('Deal is not in pending status');
      }
      
      const [acceptedDeal] = await tx.update(deals)
        .set({ status: 'in_escrow', updated_at: new Date() })
        .where(eq(deals.id, dealId))
        .returning();
      
      await tx.update(deals)
        .set({ status: 'cancelled', updated_at: new Date() })
        .where(and(
          eq(deals.listing_id, dealToAccept.listing_id),
          ne(deals.id, dealId),
          eq(deals.status, 'pending')
        ));
      
      return acceptedDeal;
    });
  } catch (error) {
    logger.error('Error accepting deal:', error);
    throw error;
  }
}
