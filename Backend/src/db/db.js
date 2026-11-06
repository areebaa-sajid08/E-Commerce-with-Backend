import dns from "node:dns/promises"
dns.setServers(["1.1.1.1", "8.8.8.8"])

import mongoose from "mongoose"
import env from "../config/env.js"

async function connectDB() {
    try {
        await mongoose.connect(env.mongoUri)
        console.log("Connected to DB")
    } catch (err) {
        console.error("Error connecting to DB", err)
        process.exit(1)
    }
}

export default connectDB
