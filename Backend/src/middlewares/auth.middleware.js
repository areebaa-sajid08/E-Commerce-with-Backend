import jwt from "jsonwebtoken"
import env from "../config/env.js"
import userModel from "../models/users.model.js"
import { ROLES } from "../config/constants.js"

export async function authenticateToken(req, res, next) {
    let token = req.cookies?.token
    const header = req.headers.authorization
    if (!token && header?.startsWith("Bearer ")) token = header.slice(7)

    if (!token) return res.status(401).json({ message: "Unauthorized" })

    try {
        const payload = jwt.verify(token, env.jwtSecret)
        // look the account up so deleted accounts / changed roles take effect immediately
        const user = await userModel.findById(payload.id).select("role")
        if (!user) return res.status(401).json({ message: "Account no longer exists" })
        req.user = { id: user._id.toString(), role: user.role }
        next()
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" })
    }
}

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" })
    }
    next()
}

export const requireAdmin = requireRole(ROLES.ADMIN)
export const requireSuperAdmin = requireRole(ROLES.SUPERADMIN)
export const requireAdminOrSuper = requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)
