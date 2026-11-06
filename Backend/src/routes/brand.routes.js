import express from "express"
import { listBrands, getBrand } from "../controllers/brand.controller.js"

const router = express.Router()
router.get("/", listBrands)
router.get("/:id", getBrand)
export default router
