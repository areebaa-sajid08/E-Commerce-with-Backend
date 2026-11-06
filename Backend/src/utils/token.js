import jwt from "jsonwebtoken"
import env from "../config/env.js"

export function signToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

export function setAuthCookie(res, user) {
    res.cookie("token", signToken(user), cookieOptions)
}
