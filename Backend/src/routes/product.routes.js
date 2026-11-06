import express from "express"
import {
    createProduct, getProducts, getMyProducts, getProduct, updateProduct, deleteProduct, getCategories,
} from "../controllers/product.controller.js"
import { getReviews, addReview, deleteReview } from "../controllers/review.controller.js"
import { authenticateToken, requireAdmin, requireAdminOrSuper } from "../middlewares/auth.middleware.js"
import upload from "../middlewares/upload.middleware.js"

const router = express.Router()
const images = upload.fields([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }])

router.get("/", getProducts)
router.get("/categories", getCategories)
router.get("/mine", authenticateToken, requireAdmin, getMyProducts)
router.post("/create", authenticateToken, requireAdmin, images, createProduct)

router.get("/:id", getProduct)
router.put("/:id", authenticateToken, requireAdmin, images, updateProduct)
router.delete("/:id", authenticateToken, requireAdminOrSuper, deleteProduct)

router.get("/:id/reviews", getReviews)
router.post("/:id/reviews", authenticateToken, addReview)
router.delete("/:id/reviews/:reviewId", authenticateToken, deleteReview)

export default router
