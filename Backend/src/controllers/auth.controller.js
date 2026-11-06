import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import passport from "passport"
import env from "../config/env.js"
import userModel from "../models/users.model.js"
import { ROLES } from "../config/constants.js"
import AppError from "../utils/AppError.js"
import { EMAIL_RE, escapeRegex } from "../utils/helpers.js"
import { setAuthCookie, cookieOptions } from "../utils/token.js"
import uploadFile from "../../services/storage.service.js"
import { announceAccountCreated, announceBrandCreated } from "../realtime.js"

function validateCredentials({ username, email, password }) {
    if (!username || username.trim().length < 3) throw new AppError("Username must be at least 3 characters")
    if (!email || !EMAIL_RE.test(email)) throw new AppError("Enter a valid email address")
    if (!password || password.length < 6) throw new AppError("Password must be at least 6 characters")
}

async function assertAvailable(username, email) {
    const exists = await userModel.findOne({ $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] })
    if (exists) throw new AppError("Username or email already in use", 409)
}

// customers - role can NOT be chosen by the client
export async function registerUser(req, res) {
    const { username, email, password } = req.body
    validateCredentials({ username, email, password })
    await assertAvailable(username, email)

    const user = await userModel.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        role: ROLES.USER,
    })
    announceAccountCreated()
    setAuthCookie(res, user)
    res.status(201).json({ message: "Account created", user })
}

// brands (admin accounts)
export async function registerBrand(req, res) {
    const { username, email, password, brandName, description } = req.body
    validateCredentials({ username, email, password })
    if (!brandName || brandName.trim().length < 2) throw new AppError("Brand name is required")
    await assertAvailable(username, email)

    const nameTaken = await userModel.findOne({ "brand.name": new RegExp(`^${escapeRegex(brandName.trim())}$`, "i") })
    if (nameTaken) throw new AppError("A brand with this name already exists", 409)

    let logo = "", logoFileId = ""
    if (req.file) {
        const up = await uploadFile(req.file.buffer, "brands")
        logo = up.url
        logoFileId = up.fileId
    }

    const user = await userModel.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        role: ROLES.ADMIN,
        brand: { name: brandName.trim(), description: (description || "").trim(), logo, logoFileId },
    })
    announceBrandCreated(user)
    setAuthCookie(res, user)
    res.status(201).json({ message: "Brand account created", user })
}

export async function loginUser(req, res) {
    const { username, email, identifier, password } = req.body
    const id = (identifier || email || username || "").trim()
    if (!id || !password) throw new AppError("Email/username and password are required")

    const user = await userModel.findOne({ $or: [{ email: id.toLowerCase() }, { username: id }] })
    if (!user) throw new AppError("User not found", 404)

    if (!user.password) throw new AppError("This account uses Google. Choose “Continue with Google”.", 400)
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) throw new AppError("Invalid password", 401)

    setAuthCookie(res, user)
    res.status(200).json({ message: "Logged in", user })
}

export async function logoutUser(_req, res) {
    res.clearCookie("token", { ...cookieOptions, maxAge: undefined })
    res.status(200).json({ message: "Logged out" })
}

export async function getMe(req, res) {
    const user = await userModel.findById(req.user.id)
    if (!user) throw new AppError("User not found", 404)
    res.status(200).json({ user })
}

/* ---------------- Google sign-in (passport.js) ---------------- */
const fail = (res, code) => res.redirect(`${env.clientUrl}/login?error=${code}`)
const stateCookie = { httpOnly: true, sameSite: "lax", secure: env.isProd, maxAge: 10 * 60 * 1000 }

// step 1: send the browser to Google. A random `state` is kept in a cookie and checked on return (CSRF protection).
export function googleStart(req, res, next) {
    if (!env.googleEnabled) return fail(res, "google_unavailable")
    const state = crypto.randomBytes(16).toString("hex")
    res.cookie("g_state", state, stateCookie)
    passport.authenticate("google", { scope: ["profile", "email"], session: false, state, prompt: "select_account" })(req, res, next)
}

// step 2: Google sends the user back here
export function googleCallback(req, res, next) {
    if (!env.googleEnabled) return fail(res, "google_unavailable")
    const expected = req.cookies?.g_state
    res.clearCookie("g_state", { ...stateCookie, maxAge: undefined })
    if (!expected || req.query.state !== expected) return fail(res, "google_failed")

    passport.authenticate("google", { session: false }, (err, user) => {
        if (err || !user) return fail(res, "google_failed")
        setAuthCookie(res, user)
        res.redirect(`${env.clientUrl}/auth/google/done`)
    })(req, res, next)
}
