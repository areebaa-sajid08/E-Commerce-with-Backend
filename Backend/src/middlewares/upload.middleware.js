import multer from "multer"
import AppError from "../utils/AppError.js"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5MB each
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(new AppError("Only image files are allowed", 400))
        cb(null, true)
    },
})

export default upload
