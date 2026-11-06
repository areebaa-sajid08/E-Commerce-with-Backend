import reviewModel from "../models/review.model.js"
import productModel from "../models/products.model.js"
import AppError from "../utils/AppError.js"
import { assertObjectId } from "../utils/helpers.js"
import { ROLES } from "../config/constants.js"
import { announceReview } from "../realtime.js"

async function refreshRating(productId) {
    const [agg] = await reviewModel.aggregate([
        { $match: { product: productId } },
        { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    await productModel.findByIdAndUpdate(productId, {
        ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
        ratingCount: agg ? agg.count : 0,
    })
}

export async function getReviews(req, res) {
    assertObjectId(req.params.id, "product id")
    const reviews = await reviewModel.find({ product: req.params.id }).sort({ createdAt: -1 }).populate("user", "username")
    res.status(200).json({ reviews })
}

export async function addReview(req, res) {
    assertObjectId(req.params.id, "product id")
    const product = await productModel.findById(req.params.id)
    if (!product) throw new AppError("Product not found", 404)
    if (product.admin.toString() === req.user.id) throw new AppError("You cannot review your own product")

    const rating = Number(req.body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError("Rating must be between 1 and 5")

    const review = await reviewModel.findOneAndUpdate(
        { product: product._id, user: req.user.id },
        { rating, comment: (req.body.comment || "").trim() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    await refreshRating(product._id)
    announceReview(product._id)
    res.status(201).json({ message: "Review saved", review })
}

export async function deleteReview(req, res) {
    assertObjectId(req.params.reviewId, "review id")
    const review = await reviewModel.findById(req.params.reviewId)
    if (!review) throw new AppError("Review not found", 404)
    if (review.user.toString() !== req.user.id && req.user.role !== ROLES.SUPERADMIN) throw new AppError("Forbidden", 403)
    await review.deleteOne()
    await refreshRating(review.product)
    announceReview(review.product)
    res.status(200).json({ message: "Review deleted" })
}
