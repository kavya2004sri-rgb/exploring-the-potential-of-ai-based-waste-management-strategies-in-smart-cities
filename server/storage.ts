import { users, listings, inquiries, purchases, type User, type InsertUser, type Listing, type InsertListing, type Inquiry, type InsertInquiry, type Purchase, type InsertPurchase } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;

  // Listings
  getListings(filters?: { category?: string; search?: string; minPrice?: number; maxPrice?: number; minQuantity?: number; maxQuantity?: number; userId?: number }): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, updates: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: number): Promise<void>;

  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesForSeller(sellerId: number): Promise<Inquiry[]>;
  getInquiriesForBuyer(buyerId: number): Promise<Inquiry[]>;

  // Purchases
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchasesForBuyer(buyerId: number): Promise<Purchase[]>;
  getPurchasesForSeller(sellerId: number): Promise<Purchase[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  updatePurchaseStatus(id: number, status: "PENDING" | "ACCEPTED" | "REJECTED"): Promise<Purchase>;

  // Metrics
  getSystemMetrics(): Promise<{
    totalListings: number;
    totalUsers: number;
    totalBuyers: number;
    totalSellers: number;
    successfulPurchases: number;
    pendingPurchases: number;
    totalRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async setResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken: token, 
        resetTokenExpiry: expiry 
      })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, userId));
  }

  // Listings
  async getListings(filters?: { category?: string; search?: string; minPrice?: number; maxPrice?: number; minQuantity?: number; maxQuantity?: number; userId?: number }): Promise<Listing[]> {
    let conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category));
    }
    
    if (filters?.userId) {
      conditions.push(eq(listings.sellerId, filters.userId));
    }
    
    if (filters?.search) {
      // SQLite doesn't support ilike, use like with lower() for case-insensitive search
      const searchPattern = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`lower(${listings.title}) like ${searchPattern}`,
          sql`lower(${listings.description}) like ${searchPattern}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    let results = await db.select()
      .from(listings)
      .where(whereClause)
      .orderBy(desc(listings.createdAt));
    
    // Apply price and quantity filters in memory (SQLite real type limitation)
    if (filters?.minPrice !== undefined) {
      results = results.filter(l => Number(l.price) >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      results = results.filter(l => Number(l.price) <= filters.maxPrice!);
    }
    if (filters?.minQuantity !== undefined) {
      results = results.filter(l => Number(l.quantity) >= filters.minQuantity!);
    }
    if (filters?.maxQuantity !== undefined) {
      results = results.filter(l => Number(l.quantity) <= filters.maxQuantity!);
    }
    
    return results;
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const [listing] = await db.insert(listings).values(insertListing).returning();
    return listing;
  }

  async updateListing(id: number, updates: Partial<InsertListing>): Promise<Listing> {
    const [listing] = await db.update(listings)
      .set(updates)
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async deleteListing(id: number): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  // Inquiries
  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values(insertInquiry).returning();
    return inquiry;
  }

  async getInquiriesForSeller(sellerId: number): Promise<Inquiry[]> {
    return db.select()
      .from(inquiries)
      .where(eq(inquiries.sellerId, sellerId))
      .orderBy(desc(inquiries.createdAt));
  }

  async getInquiriesForBuyer(buyerId: number): Promise<Inquiry[]> {
    return db.select()
      .from(inquiries)
      .where(eq(inquiries.buyerId, buyerId))
      .orderBy(desc(inquiries.createdAt));
  }

  // Purchases
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(insertPurchase).returning();
    return purchase;
  }

  async getPurchasesForBuyer(buyerId: number): Promise<Purchase[]> {
    return db.select()
      .from(purchases)
      .where(eq(purchases.buyerId, buyerId))
      .orderBy(desc(purchases.createdAt));
  }

  async getPurchasesForSeller(sellerId: number): Promise<Purchase[]> {
    return db.select()
      .from(purchases)
      .where(eq(purchases.sellerId, sellerId))
      .orderBy(desc(purchases.createdAt));
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select()
      .from(purchases)
      .where(eq(purchases.id, id));
    return purchase;
  }

  async updatePurchaseStatus(id: number, status: "PENDING" | "ACCEPTED" | "REJECTED"): Promise<Purchase> {
    const [updated] = await db.update(purchases)
      .set({ status })
      .where(eq(purchases.id, id))
      .returning();
    return updated;
  }

  // Metrics
  async getSystemMetrics() {
    const [totalListingsResult] = await db.select({ count: sql<number>`count(*)` }).from(listings);
    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalBuyersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'buyer'));
    const [totalSellersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'seller'));
    const [successfulPurchasesResult] = await db.select({ count: sql<number>`count(*)` }).from(purchases).where(eq(purchases.status, 'ACCEPTED'));
    const [pendingPurchasesResult] = await db.select({ count: sql<number>`count(*)` }).from(purchases).where(eq(purchases.status, 'PENDING'));
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(sum(${purchases.totalPrice}), 0)` }).from(purchases).where(eq(purchases.status, 'ACCEPTED'));

    return {
      totalListings: Number(totalListingsResult.count),
      totalUsers: Number(totalUsersResult.count),
      totalBuyers: Number(totalBuyersResult.count),
      totalSellers: Number(totalSellersResult.count),
      successfulPurchases: Number(successfulPurchasesResult.count),
      pendingPurchases: Number(pendingPurchasesResult.count),
      totalRevenue: Number(revenueResult.total),
    };
  }
}

export const storage = new DatabaseStorage();
