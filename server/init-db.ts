import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Create users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create listings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit TEXT NOT NULL,
        price INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        location TEXT NOT NULL,
        images TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )
    `);

    // Create purchases table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        listing_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (listing_id) REFERENCES listings(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )
    `);

    // Create inquiries table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        listing_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        reply TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (listing_id) REFERENCES listings(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
