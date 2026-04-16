import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("buyer1");
  if (existingUsers) return;

  const buyerPassword = await hashPassword("password123");
  const sellerPassword = await hashPassword("password123");

  const buyer = await storage.createUser({
    username: "buyer1",
    password: buyerPassword,
    email: "buyer@example.com",
    phone: "555-0101",
    role: "buyer",
  });

  const seller = await storage.createUser({
    username: "seller1",
    password: sellerPassword,
    email: "seller@example.com",
    phone: "555-0102",
    role: "seller",
  });

  console.log("Seeded users");

  await storage.createListing({
    sellerId: seller.id,
    title: "50kg Mixed Glass Bottles",
    description: "Assorted glass bottles, rinsed and sorted by color. Ready for pickup.",
    category: "Glass",
    quantity: "50",
    unit: "kg",
    price: "15.00",
    location: { lat: 40.7128, lng: -74.0060, address: "New York, NY" },
    images: ["https://images.unsplash.com/photo-1605600659908-0ef719419d41"],
    status: "available",
  });

  await storage.createListing({
    sellerId: seller.id,
    title: "100 Plastic Crates",
    description: "High density polyethylene crates. Good condition.",
    category: "Plastic",
    quantity: "100",
    unit: "units",
    price: "200.00",
    location: { lat: 40.7200, lng: -74.0100, address: "Tribeca, NY" },
    images: ["https://images.unsplash.com/photo-1611284446314-60a58ac0deb9"],
    status: "available",
  });

  console.log("Seeded listings");
}
