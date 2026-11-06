import userModel from "../models/users.model.js"
import productModel from "../models/products.model.js"
import { ROLES } from "../config/constants.js"
import AppError from "../utils/AppError.js"
import { assertObjectId } from "../utils/helpers.js"
import { purgeProduct } from "./product.controller.js"
import { deleteFile } from "../../services/storage.service.js"
import { announceBrandDeleted } from "../realtime.js"

const PUBLIC_BRAND = "username brand.name brand.logo brand.description createdAt"

export async function listBrands(_req, res) {
    const brands = await userModel.find({ role: ROLES.ADMIN }).select(PUBLIC_BRAND).sort({ createdAt: -1 }).lean()
    const counts = await productModel.aggregate([{ $group: { _id: "$admin", count: { $sum: 1 } } }])
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]))
    res.status(200).json({
        brands: brands.map((b) => ({ ...b, productCount: countMap.get(b._id.toString()) || 0 })),
    })
}

export async function getBrand(req, res) {
    assertObjectId(req.params.id, "brand id")
    const brand = await userModel.findOne({ _id: req.params.id, role: ROLES.ADMIN }).select(PUBLIC_BRAND)
    if (!brand) throw new AppError("Brand not found", 404)
    const products = await productModel.find({ admin: brand._id }).sort({ createdAt: -1 })
    res.status(200).json({ brand, products })
}

// deleting a brand removes the account, all its products (+ images), and cleans carts/wishlists
export async function purgeBrand(brand) {
    const products = await productModel.find({ admin: brand._id })
    for (const p of products) await purgeProduct(p)
    await deleteFile(brand.brand?.logoFileId)
    await brand.deleteOne()
    announceBrandDeleted(brand._id)
}
