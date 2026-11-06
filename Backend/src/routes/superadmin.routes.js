import express from "express"
import {
    getStats, listBrandsAdmin, deleteBrand, listUsers, deleteUser, listOrders,
} from "../controllers/superadmin.controller.js"
import { authenticateToken, requireSuperAdmin } from "../middlewares/auth.middleware.js"

const router = express.Router()
router.use(authenticateToken, requireSuperAdmin)

router.get("/stats", getStats)
router.get("/brands", listBrandsAdmin)
router.delete("/brands/:id", deleteBrand)
router.get("/users", listUsers)
router.delete("/users/:id", deleteUser)
router.get("/orders", listOrders)
// product delete: DELETE /api/product/:id  (superadmin allowed)
// order status:   PATCH  /api/orders/:id/status (superadmin allowed)

export default router
