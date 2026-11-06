import "dotenv/config"

const required = ["MONGO_URI", "JWT_SECRET", "IMAGEKIT_PRIVATE_KEY"]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    console.error("Create a .env file (see .env.example).")
    process.exit(1)
}

const env = {
    port: Number(process.env.PORT) || 3000,
    isProd: process.env.NODE_ENV === "production",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    imagekitKey: process.env.IMAGEKIT_PRIVATE_KEY,
    shippingFee: Number(process.env.SHIPPING_FEE ?? 250),
    freeShippingAbove: Number(process.env.FREE_SHIPPING_ABOVE ?? 15000),
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
}
// Google sign-in is optional: the button just reports "unavailable" until these are set
env.googleEnabled = Boolean(env.googleClientId && env.googleClientSecret)

export default env
