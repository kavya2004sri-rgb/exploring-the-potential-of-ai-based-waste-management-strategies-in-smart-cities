import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["buyer", "seller"] }).notNull().default("buyer"),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sellerId: integer("seller_id").notNull(), // References users.id (handled in logic/relations)
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Glass, Plastic, etc.
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(), // kg, units, tons
  price: real("price").notNull(),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  location: text("location", { mode: "json" }).notNull(), // { lat: number, lng: number, address: string }
  images: text("images", { mode: "json" }).notNull(),
  status: text("status", { enum: ["available", "sold"] }).default("available"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  quantity: real("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  status: text("status", { enum: ["PENDING", "ACCEPTED", "REJECTED"] }).default("PENDING"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertListingSchema = createInsertSchema(listings).omit({ id: true, sellerId: true, createdAt: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });

// Client input schema - only listingId and quantity
export const createPurchaseRequestSchema = z.object({
  listingId: z.number(),
  quantity: z.number().positive(),
});

// Full insert schema for database operations (server-side only)
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true });

// === EXPLICIT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type CreatePurchaseRequest = z.infer<typeof createPurchaseRequestSchema>;

// Request/Response Types
export type AuthResponse = User;

export type CreateListingRequest = InsertListing;
export type UpdateListingRequest = Partial<InsertListing>;

export type CreateInquiryRequest = InsertInquiry;

export interface IdentifyWasteResponse {
  material: string;
  category: string;
  confidence: number;
  description: string;
}
