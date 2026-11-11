import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import env from "./config/env.js"
import userModel from "./models/users.model.js"
import productModel from "./models/products.model.js"
import { ROLES } from "./config/constants.js"

// Socket.IO layer. Everything here is best-effort: a failure to broadcast must never break an API request.
//
// Rooms:  public        every visitor (also signed-out ones)
//         user:<id>     one account (customer, brand or admin) - all of its tabs/devices
//         super         the super admin

let io = null
const BRAND_FIELDS = "username brand.name brand.logo brand.description"

function readCookie(header = "", name) {
    const part = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
    return part ? decodeURIComponent(part.slice(name.length + 1)) : null
}

export function initRealtime(httpServer) {
    io = new Server(httpServer, { cors: { origin: env.clientOrigins, credentials: true } })

    // identify the visitor from the same httpOnly cookie the API uses; anonymous visitors are allowed
    io.use(async (socket, next) => {
        try {
            const token = readCookie(socket.handshake.headers.cookie, "token")
            if (token) {
                const payload = jwt.verify(token, env.jwtSecret)
                const user = await userModel.findById(payload.id).select("role")
                if (user) socket.data.user = { id: user._id.toString(), role: user.role }
            }
        } catch {
            /* invalid or expired token: treat as anonymous */
        }
        next()
    })

    io.on("connection", (socket) => {
        socket.join("public")
        const u = socket.data.user
        if (u) {
            socket.join(`user:${u.id}`)
            if (u.role === ROLES.SUPERADMIN) socket.join("super")
        }
    })
    return io
}

export const toPublic = (event, payload) => io?.to("public").emit(event, payload)
export const toUser = (id, event, payload) => io?.to(`user:${id}`).emit(event, payload)
export const toSuper = (event, payload) => io?.to("super").emit(event, payload)
export const adminRefresh = () => toSuper("admin:refresh")

const safe = (fn) => async (...args) => {
    if (!io) return
    try {
        await fn(...args)
    } catch (err) {
        console.error("realtime error:", err?.message || err)
    }
}

// who has this product in their bag / saved list (call BEFORE the product is removed from those lists)
export async function holdersOf(productId) {
    const [cart, wish] = await Promise.all([
        userModel.find({ "cart.product": productId }).select("_id").lean(),
        userModel.find({ wishlist: productId }).select("_id").lean(),
    ])
    return { cart: cart.map((u) => u._id), wish: wish.map((u) => u._id) }
}

export const announceProductCreated = safe(async (productId) => {
    const product = await productModel.findById(productId).populate("admin", BRAND_FIELDS)
    if (!product) return
    toPublic("product:created", product)
    adminRefresh()
})

// price / stock / details / rating changed: tell everyone looking at it and everyone who has it in a bag
export const announceProducts = safe(async (ids) => {
    const list = await productModel.find({ _id: { $in: ids } }).populate("admin", BRAND_FIELDS)
    for (const p of list) toPublic("product:updated", p)
    const holders = await userModel.find({ "cart.product": { $in: ids } }).select("_id").lean()
    for (const h of holders) toUser(h._id, "cart:refresh")
    adminRefresh()
})

export const announceProductDeleted = safe(async (productId, holders) => {
    toPublic("product:deleted", { id: productId.toString() })
    for (const id of holders?.cart || []) toUser(id, "cart:refresh")
    for (const id of holders?.wish || []) toUser(id, "wishlist:refresh")
    adminRefresh()
})

export const announceOrders = safe(async (orders, event) => {
    for (const order of orders) {
        const data = order.toJSON ? order.toJSON() : order
        toUser(order.user, event, data)
        toUser(order.brand, event, data)
        toSuper(event, data)
    }
})

export const announceReview = safe(async (productId) => {
    toPublic("review:changed", { productId: productId.toString() })
    await announceProducts([productId])
})

export const announceAccountCreated = safe(async () => adminRefresh())

export const announceBrandCreated = safe(async (brandUser) => {
    toPublic("brand:created", { id: brandUser._id.toString() })
    adminRefresh()
})

export const announceBrandDeleted = safe(async (brandId) => {
    toPublic("brand:deleted", { id: brandId.toString() })
    await announceAccountDeleted(brandId)
})

// the account was removed by the super admin: sign its open tabs out
export const announceAccountDeleted = safe(async (userId) => {
    const room = `user:${userId}`
    io.to(room).emit("account:deleted")
    io.in(room).disconnectSockets(true)
    adminRefresh()
})

export const pushCart = (userId, data) => toUser(userId, "cart:updated", data)

export const pushWishlist = safe(async (userId) => {
    const user = await userModel.findById(userId).select("wishlist").lean()
    toUser(userId, "wishlist:updated", { ids: (user?.wishlist || []).map(String) })
})
