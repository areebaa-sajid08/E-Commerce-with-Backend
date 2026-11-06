import express from "express"
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cart.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const router = express.Router()
router.use(authenticateToken)

router.get("/", getCart)
router.post("/items", addToCart)
router.patch("/items/:itemId", updateCartItem)
router.delete("/items/:itemId", removeCartItem)
router.delete("/", clearCart)

export default router
