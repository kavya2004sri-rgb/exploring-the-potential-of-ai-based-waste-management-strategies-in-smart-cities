import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import { api } from "@shared/routes";
import { z } from "zod";
import { seedDatabase } from "./seed";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Configure multer for image upload
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "dummy",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Authentication
  setupAuth(app);
  
  // Seed Database (async, don't await to not block startup, or await if critical)
  seedDatabase().catch(console.error);

  // Image Upload endpoint
  app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Listings
  app.get(api.listings.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const minQuantity = req.query.minQuantity ? Number(req.query.minQuantity) : undefined;
    const maxQuantity = req.query.maxQuantity ? Number(req.query.maxQuantity) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    
    const listings = await storage.getListings({ 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      minQuantity, 
      maxQuantity,
      userId
    });
    res.json(listings);
  });

  app.get(api.listings.get.path, async (req, res) => {
    const listing = await storage.getListing(Number(req.params.id));
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    
    // Fetch seller info
    const seller = await storage.getUser(listing.sellerId);
    const response = {
      ...listing,
      seller: seller ? {
        username: seller.username,
        email: seller.email,
        phone: seller.phone
      } : null
    };
    
    res.json(response);
  });

  app.post(api.listings.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Check if user is a seller
    if (req.user!.role !== 'seller') {
      return res.status(403).json({ message: "Only sellers can create listings" });
    }
    
    try {
      const listingData = api.listings.create.input.parse(req.body);
      
      // Validate required fields
      if (!listingData.title || !listingData.description) {
        return res.status(400).json({ message: "Title and description are required" });
      }
      
      const listing = await storage.createListing({
        ...listingData,
        sellerId: req.user!.id,
      });
      res.status(201).json(listing);
    } catch (e) {
      console.error("Create listing error:", e);
      res.status(400).json({ message: e instanceof Error ? e.message : "Invalid input" });
    }
  });

  app.put(api.listings.update.path, async (req, res) => {
    console.log("Update request received - Authenticated:", req.isAuthenticated(), "User:", req.user);
    
    if (!req.isAuthenticated() || !req.user) {
      console.log("Unauthorized - User not logged in");
      return res.status(401).json({ message: "Please log in to edit listings" });
    }
    
    try {
      const id = Number(req.params.id);
      console.log("Update listing ID:", id, "User ID:", req.user.id, "User role:", req.user.role);
      
      const existing = await storage.getListing(id);
      if (!existing) {
        console.log("Listing not found:", id);
        return res.status(404).json({ message: "Listing not found" });
      }
      
      console.log("Existing listing - sellerId:", existing.sellerId, "(type:", typeof existing.sellerId, ")");
      console.log("Current user - id:", req.user.id, "(type:", typeof req.user.id, ")");
      
      // Ensure both are numbers for comparison
      const listingSellerId = Number(existing.sellerId);
      const currentUserId = Number(req.user.id);
      
      if (listingSellerId !== currentUserId) {
        console.log("FORBIDDEN: User", currentUserId, "trying to edit listing owned by", listingSellerId);
        return res.status(403).json({ 
          message: "You can only edit your own listings. This listing belongs to another seller." 
        });
      }

      const updates = api.listings.update.input.parse(req.body);
      console.log("Applying updates:", Object.keys(updates));
      
      const updated = await storage.updateListing(id, updates);
      console.log("Listing updated successfully!");
      res.json(updated);
    } catch (e: any) {
      console.error("Update listing error:", e.message, e.stack);
      res.status(400).json({ message: e.message || "Invalid input" });
    }
  });

  app.delete(api.listings.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    const existing = await storage.getListing(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.sellerId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    
    await storage.deleteListing(id);
    res.status(204).send();
  });

  // AI Waste Identification
  app.post(api.ai.identify.path, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ message: "Image required" });

      // Remove header if present (data:image/jpeg;base64,...)
      const base64Data = image.split(",")[1] || image;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "Identify the waste material in this image. Return a JSON object with keys: material (string), category (one of: Glass, Plastic, Metal, Paper, Wood, E-waste, Other), confidence (number 0-1), description (short string).";

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg", // Assuming jpeg, but Gemini is flexible
          },
        },
      ]);

      const responseText = result.response.text();
      // Clean up markdown code blocks if present
      const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      res.json(data);
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ message: "Failed to identify waste" });
    }
  });

  // Inquiries
  app.post(api.inquiries.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.inquiries.create.input.parse(req.body);
      const inquiry = await storage.createInquiry({
        ...input,
        buyerId: req.user!.id,
      });
      res.status(201).json(inquiry);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Purchases
  app.post(api.purchases.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      console.log("Purchase request body:", req.body);
      console.log("User:", req.user);
      
      const input = api.purchases.create.input.parse(req.body);
      console.log("Parsed input:", input);
      
      // Get listing to verify seller and calculate total
      const listing = await storage.getListing(input.listingId);
      if (!listing) {
        console.log("Listing not found:", input.listingId);
        return res.status(404).json({ message: "Listing not found" });
      }
      console.log("Found listing:", listing);
      
      // Verify quantity is available
      if (Number(input.quantity) > Number(listing.quantity)) {
        console.log("Quantity exceeds available:", input.quantity, "vs", listing.quantity);
        return res.status(400).json({ message: "Requested quantity exceeds available quantity" });
      }
      
      const pricePerUnit = Number(listing.price) / Number(listing.quantity);
      const purchaseData = {
        listingId: input.listingId,
        buyerId: req.user!.id,
        sellerId: listing.sellerId,
        quantity: Number(input.quantity),
        totalPrice: pricePerUnit * Number(input.quantity),
        status: "PENDING" as const,
      };
      console.log("Creating purchase with data:", purchaseData);
      
      const purchase = await storage.createPurchase(purchaseData);
      console.log("Purchase created successfully:", purchase);
      res.status(201).json(purchase);
    } catch (e: any) {
      console.error("Purchase creation error:", e);
      console.error("Error stack:", e.stack);
      res.status(400).json({ message: e.message || "Invalid input" });
    }
  });

  app.get(api.purchases.myPurchases.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const purchases = await storage.getPurchasesForBuyer(req.user!.id);
    
    // Enrich with listing and seller info
    const enriched = await Promise.all(purchases.map(async (p) => {
      const listing = await storage.getListing(p.listingId);
      const seller = listing ? await storage.getUser(listing.sellerId) : null;
      return {
        ...p,
        listing,
        seller: seller ? { username: seller.username, email: seller.email, phone: seller.phone } : null,
      };
    }));
    
    res.json(enriched);
  });

  app.get(api.purchases.mySales.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const purchases = await storage.getPurchasesForSeller(req.user!.id);
    
    // Enrich with listing and buyer info
    const enriched = await Promise.all(purchases.map(async (p) => {
      const listing = await storage.getListing(p.listingId);
      const buyer = await storage.getUser(p.buyerId);
      return {
        ...p,
        listing,
        buyer: buyer ? { username: buyer.username, email: buyer.email, phone: buyer.phone } : null,
      };
    }));
    
    res.json(enriched);
  });

  app.put(api.purchases.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const id = Number(req.params.id);
      const { status } = api.purchases.updateStatus.input.parse(req.body);
      
      const purchase = await storage.getPurchase(id);
      if (!purchase) return res.status(404).json({ message: "Purchase not found" });
      
      // Only seller can update status
      if (purchase.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Only seller can update purchase status" });
      }
      
      const updated = await storage.updatePurchaseStatus(id, status);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Performance metrics endpoint (for admin/analytics)
  app.get('/api/metrics', async (req, res) => {
    try {
      // Only allow authenticated users to view metrics
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Metrics error:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  // Forgot Password Routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }

      // Generate random reset token
      const resetToken = randomBytes(32).toString('hex');
      
      // Hash the token before storing
      const salt = randomBytes(16).toString('hex');
      const hashedToken = (await scryptAsync(resetToken, salt, 64)) as Buffer;
      const hashedTokenWithSalt = `${hashedToken.toString('hex')}.${salt}`;
      
      // Token expires in 1 hour
      const resetTokenExpiry = new Date(Date.now() + 3600000);
      
      // Store hashed token and expiry
      await storage.setResetToken(user.id, hashedTokenWithSalt, resetTokenExpiry);
      
      // In production, send email with reset link containing the token
      // For now, log it (in production you'd use nodemailer or similar)
      console.log(`Reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: http://localhost:5000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);
      
      res.json({ 
        message: "If the email exists, a reset link has been sent",
        // DEVELOPMENT ONLY - Remove in production
        devToken: resetToken,
        devLink: `http://localhost:5000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      
      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Email, token, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Verify token
      const [hashedToken, salt] = user.resetToken.split('.');
      const hashedProvidedToken = (await scryptAsync(token, salt, 64)) as Buffer;
      
      if (hashedToken !== hashedProvidedToken.toString('hex')) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Hash new password
      const newSalt = randomBytes(16).toString('hex');
      const hashedPassword = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      const hashedPasswordWithSalt = `${hashedPassword.toString('hex')}.${newSalt}`;
      
      // Update password and clear reset token
      await storage.updatePassword(user.id, hashedPasswordWithSalt);
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  return httpServer;
}
