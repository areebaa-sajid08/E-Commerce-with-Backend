import mongoose from "mongoose"
import AppError from "./AppError.js"

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function assertObjectId(id, label = "id") {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label}`, 400)
}

// accepts: ["a","b"] | "a,b" | '["a","b"]' | undefined
export function toArray(value) {
    if (value === undefined || value === null || value === "") return []
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
    const str = String(value).trim()
    if (str.startsWith("[")) {
        try {
            return toArray(JSON.parse(str))
        } catch {
            /* fall through */
        }
    }
    return str.split(",").map((v) => v.trim()).filter(Boolean)
}

export function toNumber(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback
    const n = Number(value)
    return Number.isFinite(n) ? n : NaN
}

export function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function paginate(query) {
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(60, Math.max(1, parseInt(query.limit) || 12))
    return { page, limit, skip: (page - 1) * limit }
}
