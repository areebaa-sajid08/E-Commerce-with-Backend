// Usage: npm run seed:admin
// Creates (or resets the password of) the single super admin from .env values.
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import env from "../config/env.js"
import connectDB from "../db/db.js"
import userModel from "../models/users.model.js"
import { ROLES } from "../config/constants.js"

const username = process.env.SUPERADMIN_USERNAME || "superadmin"
const email = (process.env.SUPERADMIN_EMAIL || "").toLowerCase()
const password = process.env.SUPERADMIN_PASSWORD || ""

if (!email || password.length < 8) {
    console.error("Set SUPERADMIN_EMAIL and a SUPERADMIN_PASSWORD (8+ chars) in .env first.")
    process.exit(1)
}
if (password === "ChangeThisPassword@123") {
    console.error("Please change SUPERADMIN_PASSWORD in .env before seeding.")
    process.exit(1)
}

await connectDB()
const hash = await bcrypt.hash(password, 10)
const existing = await userModel.findOne({ role: ROLES.SUPERADMIN })

if (existing) {
    existing.username = username
    existing.email = email
    existing.password = hash
    await existing.save()
    console.log(`Super admin updated: ${email}`)
} else {
    await userModel.create({ username, email, password: hash, role: ROLES.SUPERADMIN })
    console.log(`Super admin created: ${email}`)
}
await mongoose.disconnect()
void env
