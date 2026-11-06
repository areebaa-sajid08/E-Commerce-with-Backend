import mongoose from "mongoose"
import { CATEGORIES } from "../config/constants.js"

const productSchema = new mongoose.Schema(
    {
        // first image url - kept so old clients that read `image` keep working
        image: { type: String, required: true },
        images: [{ url: String, fileId: String, _id: false }],
        name: { type: String, required: true, trim: true },
        desc: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        comparePrice: { type: Number, min: 0, default: 0 }, // original price, for "sale" display
        stock: { type: Number, required: true, min: 0, default: 0 },
        sizes: [{ type: String, trim: true }],
        colors: [{ type: String, trim: true }],
        category: { type: String, enum: CATEGORIES, default: "Everyday" },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
    },
    { timestamps: true }
)

productSchema.index({ name: "text", desc: "text" })

const productModel = mongoose.model("product", productSchema)
export default productModel
