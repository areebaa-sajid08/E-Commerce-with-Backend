import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import passport from "passport"
import { setupPassport } from "./config/passport.js"
import env from "./config/env.js"
import authRoutes from "./routes/auth.routes.js"
import productRoutes from "./routes/product.routes.js"
import cartRoutes from "./routes/cart.routes.js"
import wishlistRoutes from "./routes/wishlist.routes.js"
import orderRoutes from "./routes/order.routes.js"
import brandRoutes from "./routes/brand.routes.js"
import superAdminRoutes from "./routes/superadmin.routes.js"
import { notFound, errorHandler } from "./middlewares/error.middleware.js"
import connectDB from "./db/db.js"
import AppError from "./utils/AppError.js"

const app = express()
app.set("trust proxy", 1) // Vercel sits behind a proxy (needed for rate limiting and secure cookies)

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(cors({ origin: env.clientOrigins, credentials: true }))
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())
setupPassport()
app.use(passport.initialize())

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts. Try again in a few minutes." },
})

app.get("/", (_req, res) => res.json({ message: "E-commerce API is running", health: "/api/health" }))
app.get("/api/health", (_req, res) => res.json({ ok: true }))

app.use("/api", async (_req, _res, next) => {
    try {
        await connectDB()
        next()
    } catch {
        next(new AppError("Database connection unavailable", 503))
    }
})

app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/product", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/brands", brandRoutes)
app.use("/api/superadmin", superAdminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
