const bcrypt = require("bcryptjs");
const User = require("../models/User");

/** Ensure every account is seller-verified (idempotent, fixes old DB rows). */
const verifyAllUsers = async () => {
  const result = await User.updateMany({}, { $set: { sellerVerified: true } });
  if (result.modifiedCount > 0) {
    console.log(`Seller verification: updated ${result.modifiedCount} user(s) to verified`);
  }
};

async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "admin@college.edu").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await User.findOne({ email });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name: "Campus Admin",
    email,
    password: hashed,
    role: "admin",
    sellerVerified: true,
    collegeVerified: true
  });
  console.log(`Default admin created: ${email}`);
}

const seedAdmin = async () => {
  await seedAdminUser();
  await verifyAllUsers();
};

module.exports = seedAdmin;
