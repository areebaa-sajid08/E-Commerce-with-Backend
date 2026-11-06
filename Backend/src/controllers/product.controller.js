import productModel from "../models/products.model.js"
import userModel from "../models/users.model.js"
import reviewModel from "../models/review.model.js"
import { CATEGORIES, ROLES } from "../config/constants.js"
import AppError from "../utils/AppError.js"
import { assertObjectId, toArray, toNumber, escapeRegex, paginate } from "../utils/helpers.js"
import uploadFile, { deleteFile } from "../../services/storage.service.js"
import { announceProductCreated, announceProducts, announceProductDeleted, holdersOf } from "../realtime.js"

const BRAND_FIELDS = "username brand.name brand.logo brand.description"

function readFiles(req) {
    const f = req.files || {}
    return [...(f.images || []), ...(f.image || [])]
}

function parseProductBody(body, { partial = false } = {}) {
    const out = {}
    const num = (key, min = 0) => {
        if (body[key] === undefined && partial) return
        const n = toNumber(body[key], key === "comparePrice" ? 0 : undefined)
        if (n === undefined || Number.isNaN(n) || n < min) throw new AppError(`${key} must be a valid number`)
        out[key] = n
    }
    if (body.name !== undefined || !partial) {
        if (!body.name?.trim()) throw new AppError("Name is required")
        out.name = body.name.trim()
    }
    if (body.desc !== undefined || !partial) {
        if (!body.desc?.trim()) throw new AppError("Description is required")
        out.desc = body.desc.trim()
    }
    num("price")
    if (body.comparePrice !== undefined) num("comparePrice")
    if (body.stock !== undefined || !partial) {
        const n = toNumber(body.stock, 0)
        if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) throw new AppError("Stock must be a whole number")
        out.stock = n
    }
    if (body.sizes !== undefined) out.sizes = toArray(body.sizes)
    if (body.colors !== undefined) out.colors = toArray(body.colors)
    if (body.category !== undefined) {
        if (!CATEGORIES.includes(body.category)) throw new AppError("Invalid category")
        out.category = body.category
    }
    if (out.comparePrice && out.price !== undefined && out.comparePrice <= out.price) out.comparePrice = 0
    return out
}

export async function createProduct(req, res) {
    const files = readFiles(req)
    if (!files.length) throw new AppError("At least one image is required")

    const data = parseProductBody(req.body)
    const uploaded = []
    for (const file of files.slice(0, 5)) uploaded.push(await uploadFile(file.buffer, "products"))

    const product = await productModel.create({
        ...data,
        image: uploaded[0].url,
        images: uploaded,
        admin: req.user.id,
    })
    announceProductCreated(product._id)
    res.status(201).json({ message: "Product added", product })
}

export async function getProducts(req, res) {
    const { q, category, brand, minPrice, maxPrice, sort, inStock, sale } = req.query
    const { page, limit, skip } = paginate(req.query)

    const filter = {}
    if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { desc: new RegExp(escapeRegex(q), "i") }]
    if (category) filter.category = category
    if (brand) {
        assertObjectId(brand, "brand")
        filter.admin = brand
    }
    if (minPrice || maxPrice) {
        filter.price = {}
        if (minPrice) filter.price.$gte = Number(minPrice)
        if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (inStock === "true") filter.stock = { $gt: 0 }
    if (sale === "true") filter.comparePrice = { $gt: 0 }

    const sorts = {
        newest: { createdAt: -1 },
        "price-asc": { price: 1 },
        "price-desc": { price: -1 },
        rating: { ratingAvg: -1, ratingCount: -1 },
    }

    const [products, total] = await Promise.all([
        productModel.find(filter).sort(sorts[sort] || sorts.newest).skip(skip).limit(limit).populate("admin", BRAND_FIELDS),
        productModel.countDocuments(filter),
    ])
    res.status(200).json({
        message: "Products fetched successfully",
        products,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
    })
}

export async function getMyProducts(req, res) {
    const products = await productModel.find({ admin: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ products })
}

export async function getProduct(req, res) {
    assertObjectId(req.params.id, "product id")
    const product = await productModel.findById(req.params.id).populate("admin", BRAND_FIELDS)
    if (!product) throw new AppError("Product not found", 404)
    res.status(200).json({ product })
}

export async function updateProduct(req, res) {
    assertObjectId(req.params.id, "product id")
    const product = await productModel.findById(req.params.id)
    if (!product) throw new AppError("Product not found", 404)
    if (product.admin.toString() !== req.user.id) throw new AppError("You can only edit your own products", 403)

    Object.assign(product, parseProductBody(req.body, { partial: true }))

    // remove selected images
    const removeIds = toArray(req.body.removeImageIds)
    if (removeIds.length) {
        const keep = product.images.filter((img) => !removeIds.includes(img.fileId))
        if (!keep.length && !readFiles(req).length) throw new AppError("A product needs at least one image")
        for (const img of product.images) if (removeIds.includes(img.fileId)) await deleteFile(img.fileId)
        product.images = keep
    }
    // add new images (max 5 total)
    const files = readFiles(req)
    for (const file of files) {
        if (product.images.length >= 5) break
        product.images.push(await uploadFile(file.buffer, "products"))
    }
    product.image = product.images[0]?.url || product.image

    await product.save()
    announceProducts([product._id])
    res.status(200).json({ message: "Product updated", product })
}

// shared by brand-owner delete, superadmin delete and brand cascade delete
export async function purgeProduct(product) {
    const holders = await holdersOf(product._id)
    for (const img of product.images || []) await deleteFile(img.fileId)
    await reviewModel.deleteMany({ product: product._id })
    await userModel.updateMany(
        {},
        { $pull: { cart: { product: product._id }, wishlist: product._id } }
    )
    await product.deleteOne()
    announceProductDeleted(product._id, holders)
}

export async function deleteProduct(req, res) {
    assertObjectId(req.params.id, "product id")
    const product = await productModel.findById(req.params.id)
    if (!product) throw new AppError("Product not found", 404)

    const isOwner = product.admin.toString() === req.user.id
    if (!isOwner && req.user.role !== ROLES.SUPERADMIN) throw new AppError("Forbidden", 403)

    await purgeProduct(product)
    res.status(200).json({ message: "Product deleted" })
}

export function getCategories(_req, res) {
    res.status(200).json({ categories: CATEGORIES })
}
