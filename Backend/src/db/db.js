import dns from "node:dns/promises"
dns.setServers(["1.1.1.1", "8.8.8.8"])

import mongoose from "mongoose"
import env from "../config/env.js"

let connectionPromise

async function connectDB() {
    if (mongoose.connection.readyState === 1) return mongoose.connection

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(env.mongoUri)
            .then(() => {
                console.log("Connected to DB")
                return mongoose.connection
            })
            .catch((err) => {
                console.error("Error connecting to DB", err)
                throw err
            })
            .finally(() => {
                connectionPromise = undefined
            })
    }

    return connectionPromise
}

export default connectDB
