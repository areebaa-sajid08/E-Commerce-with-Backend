import userModel from "../models/users.model.js"
import productModel from "../models/products.model.js"
import orderModel from "../models/order.model.js"
import { ROLES } from "../config/constants.js"
import AppError from "../utils/AppError.js"
import { assertObjectId, paginate } from "../utils/helpers.js"
import { purgeBrand } from "./brand.controller.js"
import { announceAccountDeleted } from "../realtime.js"

export async function getStats(_req, res) {
    const [users, brands, products, orders, revenueAgg, recentOrders] = await Promise.all([
        userModel.countDocuments({ role: ROLES.USER }),
        userModel.countDocuments({ role: ROLES.ADMIN }),
        productModel.countDocuments(),
        orderModel.countDocuments(),
        orderModel.aggregate([{ $match: { status: "delivered" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
        orderModel.find().sort({ createdAt: -1 }).limit(5).populate("user", "username"),
    ])
    res.status(200).json({
        stats: { users, brands, products, orders, revenue: revenueAgg[0]?.total || 0 },
        recentOrders,
    })
}

export async function listBrandsAdmin(_req, res) {
    const brands = await userModel.find({ role: ROLES.ADMIN }).sort({ createdAt: -1 }).lean()
    const counts = await productModel.aggregate([{ $group: { _id: "$admin", count: { $sum: 1 } } }])
    const map = new Map(counts.map((c) => [c._id.toString(), c.count]))
    res.status(200).json({
        brands: brands.map(({ password, cart, wishlist, ...b }) => ({ ...b, productCount: map.get(b._id.toString()) || 0 })),
    })
}

export async function deleteBrand(req, res) {
    assertObjectId(req.params.id, "brand id")
    const brand = await userModel.findOne({ _id: req.params.id, role: ROLES.ADMIN })
    if (!brand) throw new AppError("Brand not found", 404)
    await purgeBrand(brand)
    res.status(200).json({ message: "Brand and all its products deleted" })
}

export async function listUsers(_req, res) {
    const users = await userModel.find({ role: ROLES.USER }).sort({ createdAt: -1 }).select("username email createdAt")
    res.status(200).json({ users })
}

export async function deleteUser(req, res) {
    assertObjectId(req.params.id, "user id")
    const user = await userModel.findOne({ _id: req.params.id, role: ROLES.USER })
    if (!user) throw new AppError("Customer not found", 404)
    await user.deleteOne()
    announceAccountDeleted(user._id)
    res.status(200).json({ message: "Customer deleted" })
}

export async function listOrders(req, res) {
    const { page, limit, skip } = paginate(req.query)
    const [orders, total] = await Promise.all([
        orderModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "username email"),
        orderModel.countDocuments(),
    ])
    res.status(200).json({ orders, total, page, pages: Math.ceil(total / limit) || 1 })
}
