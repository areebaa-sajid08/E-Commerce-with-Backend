import express from "express"
import { registerUser, registerBrand, loginUser, logoutUser, getMe, googleStart, googleCallback } from "../controllers/auth.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"
import upload from "../middlewares/upload.middleware.js"

const router = express.Router()

router.post("/register", registerUser)
router.post("/register-brand", upload.single("logo"), registerBrand)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.get("/google", googleStart)
router.get("/google/callback", googleCallback)
router.get("/me", authenticateToken, getMe)

export default router
