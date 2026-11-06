import mongoose from "mongoose"
import { ROLES } from "../config/constants.js"

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
})

const userSchema = new mongoose.Schema(
    {
        username: { type: String, unique: true, required: true, trim: true },
        email: { type: String, unique: true, required: true, trim: true, lowercase: true },
        // not required for accounts created with Google
        password: { type: String, required: function () { return !this.googleId } },
        googleId: { type: String, unique: true, sparse: true },
        avatar: { type: String, default: "" },
        role: { type: String, default: ROLES.USER, enum: Object.values(ROLES) },

        // only filled for role === "admin" (a brand account)
        brand: {
            name: { type: String, trim: true },
            description: { type: String, trim: true, default: "" },
            logo: { type: String, default: "" },
            logoFileId: { type: String, default: "" },
        },

        cart: [cartItemSchema],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
    },
    { timestamps: true }
)

userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password
        delete ret.googleId
        if (ret.brand) delete ret.brand.logoFileId
        return ret
    },
})

const userModel = mongoose.model("user", userSchema)
export default userModel
