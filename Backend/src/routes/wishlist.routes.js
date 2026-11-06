import express from "express"
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/cart.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const router = express.Router()
router.use(authenticateToken)

router.get("/", getWishlist)
router.post("/:productId", addToWishlist)
router.delete("/:productId", removeFromWishlist)

export default router
