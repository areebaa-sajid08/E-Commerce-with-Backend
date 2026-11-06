import multer from "multer"

export function notFound(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    let status = err.status || 500
    let message = err.message || "Internal server error"

    if (err instanceof multer.MulterError) {
        status = 400
        message = err.code === "LIMIT_FILE_SIZE" ? "Each image must be 5MB or smaller" : err.message
    } else if (err.name === "ValidationError") {
        status = 400
        message = Object.values(err.errors).map((e) => e.message).join(", ")
    } else if (err.name === "CastError") {
        status = 400
        message = `Invalid ${err.path}`
    } else if (err.code === 11000) {
        status = 409
        message = `${Object.keys(err.keyPattern || {})[0] || "Value"} already exists`
    }

    if (status >= 500) console.error(err)
    res.status(status).json({ message })
}
