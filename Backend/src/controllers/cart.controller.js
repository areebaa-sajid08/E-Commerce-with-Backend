import productModel from "../models/products.model.js"
import userModel from "../models/users.model.js"
import env from "../config/env.js"
import AppError from "../utils/AppError.js"
import { assertObjectId } from "../utils/helpers.js"
import { pushCart, pushWishlist } from "../realtime.js"

const PRODUCT_FIELDS = "name desc image price comparePrice stock sizes colors admin category"

// loads the cart with product details, drops items whose product no longer exists
export async function buildCart(userId) {
    const user = await userModel
        .findById(userId)
        .select("cart")
        .populate({ path: "cart.product", select: PRODUCT_FIELDS, populate: { path: "admin", select: "brand.name" } })
    if (!user) throw new AppError("User not found", 404)

    const dead = user.cart.filter((i) => !i.product)
    if (dead.length) {
        user.cart = user.cart.filter((i) => i.product)
        await user.save()
    }

    const items = user.cart.map((i) => {
        const p = i.product
        return {
            _id: i._id,
            product: p,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            lineTotal: p.price * i.quantity,
            available: p.stock >= i.quantity, // false -> not enough stock any more
        }
    })
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0)
    const count = items.reduce((sum, i) => sum + i.quantity, 0)

    // delivery is charged per brand (each brand ships its own parcel)
    const perBrand = new Map()
    for (const i of items) {
        const b = i.product.admin?._id?.toString() || "unknown"
        perBrand.set(b, (perBrand.get(b) || 0) + i.lineTotal)
    }
    const shipping = [...perBrand.values()].reduce((s, t) => s + (t >= env.freeShippingAbove ? 0 : env.shippingFee), 0)

    return {
        cart: items,
        summary: { count, subtotal, shipping, total: subtotal + shipping, parcels: perBrand.size, freeShippingAbove: env.freeShippingAbove },
    }
}

// answer the request and mirror the new cart to every other open tab/device of this user
async function respondCart(req, res, message) {
    const data = await buildCart(req.user.id)
    pushCart(req.user.id, data)
    res.status(200).json({ message, ...data })
}

export async function getCart(req, res) {
    res.status(200).json(await buildCart(req.user.id))
}

export async function addToCart(req, res) {
    const { productId } = req.body
    const quantity = Number(req.body.quantity) || 1
    const size = (req.body.size || "").trim()
    const color = (req.body.color || "").trim()

    assertObjectId(productId, "product id")
    if (!Number.isInteger(quantity) || quantity < 1) throw new AppError("Quantity must be a positive whole number")

    const product = await productModel.findById(productId)
    if (!product) throw new AppError("Product not found", 404)
    if (product.admin.toString() === req.user.id) throw new AppError("You cannot buy your own product")
    if (product.sizes.length && !product.sizes.includes(size)) throw new AppError("Please choose a size")
    if (product.colors.length && !product.colors.includes(color)) throw new AppError("Please choose a colour")
    if (product.stock < 1) throw new AppError("This product is out of stock")

    const user = await userModel.findById(req.user.id)
    const existing = user.cart.find(
        (i) => i.product.toString() === productId && i.size === size && i.color === color
    )
    const newQty = (existing?.quantity || 0) + quantity
    if (newQty > product.stock) throw new AppError(`Only ${product.stock} left in stock`)

    if (existing) existing.quantity = newQty
    else user.cart.push({ product: productId, quantity, size, color })
    await user.save()

    await respondCart(req, res, "Added to cart")
}

// set an exact quantity (used by the + / - buttons)
export async function updateCartItem(req, res) {
    const quantity = Number(req.body.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) throw new AppError("Quantity must be a positive whole number")

    const user = await userModel.findById(req.user.id)
    const item = user.cart.id(req.params.itemId)
    if (!item) throw new AppError("Item not in cart", 404)

    const product = await productModel.findById(item.product)
    if (!product) throw new AppError("Product no longer exists", 404)
    if (quantity > product.stock) throw new AppError(`Only ${product.stock} left in stock`)

    item.quantity = quantity
    await user.save()
    await respondCart(req, res, "Cart updated")
}

export async function removeCartItem(req, res) {
    const user = await userModel.findById(req.user.id)
    const item = user.cart.id(req.params.itemId)
    if (!item) throw new AppError("Item not in cart", 404)
    user.cart.pull(item._id)
    await user.save()
    await respondCart(req, res, "Item removed")
}

export async function clearCart(req, res) {
    await userModel.findByIdAndUpdate(req.user.id, { $set: { cart: [] } })
    const empty = { cart: [], summary: { count: 0, subtotal: 0, shipping: 0, total: 0, parcels: 0 } }
    pushCart(req.user.id, empty)
    res.status(200).json({ message: "Cart cleared", ...empty })
}

/* ---------------- wishlist ---------------- */
export async function getWishlist(req, res) {
    const user = await userModel.findById(req.user.id).select("wishlist").populate({
        path: "wishlist",
        populate: { path: "admin", select: "brand.name username" },
    })
    const wishlist = user.wishlist.filter(Boolean)
    res.status(200).json({ wishlist })
}

export async function addToWishlist(req, res) {
    assertObjectId(req.params.productId, "product id")
    const exists = await productModel.exists({ _id: req.params.productId })
    if (!exists) throw new AppError("Product not found", 404)
    await userModel.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: req.params.productId } })
    pushWishlist(req.user.id)
    res.status(200).json({ message: "Saved to wishlist" })
}

export async function removeFromWishlist(req, res) {
    await userModel.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.productId } })
    pushWishlist(req.user.id)
    res.status(200).json({ message: "Removed from wishlist" })
}

