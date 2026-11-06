import crypto from "node:crypto"
import productModel from "../models/products.model.js"
import userModel from "../models/users.model.js"
import orderModel from "../models/order.model.js"
import env from "../config/env.js"
import { ROLES, STATUS_FLOW, ORDER_STATUS } from "../config/constants.js"
import AppError from "../utils/AppError.js"
import { assertObjectId } from "../utils/helpers.js"
import { announceOrders, announceProducts, pushCart } from "../realtime.js"

function readShipping(body) {
    const s = body.shipping || {}
    const clean = (v) => (typeof v === "string" ? v.trim() : "")
    const shipping = {
        fullName: clean(s.fullName),
        phone: clean(s.phone),
        address: clean(s.address),
        city: clean(s.city),
        postalCode: clean(s.postalCode),
        notes: clean(s.notes),
    }
    if (!shipping.fullName) throw new AppError("Full name is required")
    if (!/^[+\d][\d\s-]{6,}$/.test(shipping.phone)) throw new AppError("Enter a valid phone number")
    if (shipping.address.length < 8) throw new AppError("Enter your full delivery address")
    if (!shipping.city) throw new AppError("City is required")
    return shipping
}

export async function checkout(req, res) {
    const shipping = readShipping(req.body)
    const paymentMethod = req.body.paymentMethod || "cod"
    if (paymentMethod !== "cod") throw new AppError("Only cash on delivery is available right now")

    const user = await userModel.findById(req.user.id)
    if (!user.cart.length) throw new AppError("Your cart is empty")

    const products = await productModel.find({ _id: { $in: user.cart.map((i) => i.product) } })
    const byId = new Map(products.map((p) => [p._id.toString(), p]))

    // group cart lines by brand
    const groups = new Map()
    for (const line of user.cart) {
        const p = byId.get(line.product.toString())
        if (!p) throw new AppError("An item in your cart is no longer available. Remove it and try again.")
        if (p.admin.toString() === req.user.id) throw new AppError("Remove your own products from the cart")
        const key = p.admin.toString()
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push({ line, p })
    }

    // reserve stock atomically, line by line; roll back if anything fails
    const reserved = []
    try {
        for (const entries of groups.values()) {
            for (const { line, p } of entries) {
                const updated = await productModel.findOneAndUpdate(
                    { _id: p._id, stock: { $gte: line.quantity } },
                    { $inc: { stock: -line.quantity } }
                )
                if (!updated) throw new AppError(`"${p.name}" does not have enough stock`)
                reserved.push({ id: p._id, qty: line.quantity })
            }
        }
    } catch (err) {
        for (const r of reserved) await productModel.findByIdAndUpdate(r.id, { $inc: { stock: r.qty } })
        throw err
    }

    const brands = await userModel.find({ _id: { $in: [...groups.keys()] } }).select("brand.name username")
    const brandName = new Map(brands.map((b) => [b._id.toString(), b.brand?.name || b.username]))

    const checkoutId = crypto.randomUUID()
    const docs = []
    for (const [brandId, entries] of groups) {
        const items = entries.map(({ line, p }) => ({
            product: p._id,
            name: p.name,
            image: p.image,
            price: p.price,
            quantity: line.quantity,
            size: line.size,
            color: line.color,
        }))
        const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
        const shippingFee = itemsTotal >= env.freeShippingAbove ? 0 : env.shippingFee
        docs.push({
            checkoutId,
            user: req.user.id,
            brand: brandId,
            brandName: brandName.get(brandId),
            items,
            shipping,
            paymentMethod,
            itemsTotal,
            shippingFee,
            total: itemsTotal + shippingFee,
        })
    }

    let orders
    try {
        orders = await orderModel.insertMany(docs)
    } catch (err) {
        for (const r of reserved) await productModel.findByIdAndUpdate(r.id, { $inc: { stock: r.qty } })
        throw err
    }

    user.cart = []
    await user.save()

    // live updates: brands see the new order, stock changes reach every open page
    announceOrders(orders, "order:created")
    pushCart(req.user.id, { cart: [], summary: { count: 0, subtotal: 0, shipping: 0, total: 0, parcels: 0 } })
    announceProducts(reserved.map((r) => r.id))

    res.status(201).json({
        message: "Order placed",
        checkoutId,
        orders,
        grandTotal: orders.reduce((s, o) => s + o.total, 0),
    })
}

export async function getMyOrders(req, res) {
    const orders = await orderModel.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ orders })
}

export async function getMyOrder(req, res) {
    assertObjectId(req.params.id, "order id")
    const order = await orderModel.findOne({ _id: req.params.id, user: req.user.id })
    if (!order) throw new AppError("Order not found", 404)
    res.status(200).json({ order })
}

async function restoreStock(order) {
    for (const item of order.items) {
        if (item.product) await productModel.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    }
}

export async function cancelMyOrder(req, res) {
    assertObjectId(req.params.id, "order id")
    const order = await orderModel.findOne({ _id: req.params.id, user: req.user.id })
    if (!order) throw new AppError("Order not found", 404)
    if (order.status !== "pending") throw new AppError("Only pending orders can be cancelled")
    order.status = "cancelled"
    await order.save()
    await restoreStock(order)
    announceOrders([order], "order:updated")
    announceProducts(order.items.map((i) => i.product).filter(Boolean))
    res.status(200).json({ message: "Order cancelled", order })
}

// brand: orders that contain its products
export async function getBrandOrders(req, res) {
    const filter = { brand: req.user.id }
    if (req.query.status && ORDER_STATUS.includes(req.query.status)) filter.status = req.query.status
    const orders = await orderModel.find(filter).sort({ createdAt: -1 }).populate("user", "username email")
    res.status(200).json({ orders })
}

export async function updateOrderStatus(req, res) {
    assertObjectId(req.params.id, "order id")
    const { status } = req.body
    if (!ORDER_STATUS.includes(status)) throw new AppError("Invalid status")

    const order = await orderModel.findById(req.params.id)
    if (!order) throw new AppError("Order not found", 404)

    const isOwner = order.brand.toString() === req.user.id
    if (!isOwner && req.user.role !== ROLES.SUPERADMIN) throw new AppError("Forbidden", 403)

    if (!STATUS_FLOW[order.status].includes(status)) {
        throw new AppError(`An order that is ${order.status} cannot be changed to ${status}`)
    }
    order.status = status
    await order.save()
    if (status === "cancelled") {
        await restoreStock(order)
        announceProducts(order.items.map((i) => i.product).filter(Boolean))
    }
    announceOrders([order], "order:updated")
    res.status(200).json({ message: `Order marked ${status}`, order })
}

export async function getBrandStats(req, res) {
    const brandId = req.user.id
    const [products, orders, delivered, lowStock] = await Promise.all([
        productModel.countDocuments({ admin: brandId }),
        orderModel.find({ brand: brandId }).select("status total"),
        orderModel.find({ brand: brandId, status: "delivered" }).select("total"),
        productModel.countDocuments({ admin: brandId, stock: { $lte: 3 } }),
    ])
    res.status(200).json({
        stats: {
            products,
            orders: orders.length,
            pending: orders.filter((o) => o.status === "pending").length,
            revenue: delivered.reduce((s, o) => s + o.total, 0),
            lowStock,
        },
    })
}

