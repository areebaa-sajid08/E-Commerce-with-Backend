import express from "express"
import {
    checkout, getMyOrders, getMyOrder, cancelMyOrder, getBrandOrders, updateOrderStatus, getBrandStats,
} from "../controllers/order.controller.js"
import { authenticateToken, requireAdmin, requireAdminOrSuper } from "../middlewares/auth.middleware.js"

const router = express.Router()
router.use(authenticateToken)

router.post("/checkout", checkout)
router.get("/mine", getMyOrders)
router.get("/brand/list", requireAdmin, getBrandOrders)
router.get("/brand/stats", requireAdmin, getBrandStats)
router.get("/mine/:id", getMyOrder)
router.patch("/mine/:id/cancel", cancelMyOrder)
router.patch("/:id/status", requireAdminOrSuper, updateOrderStatus)

export default router
