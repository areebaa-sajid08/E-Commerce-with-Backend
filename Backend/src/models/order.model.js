import mongoose from "mongoose"
import { ORDER_STATUS } from "../config/constants.js"

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        name: String,
        image: String,
        price: Number, // price at the moment of purchase
        quantity: Number,
        size: String,
        color: String,
    },
    { _id: false }
)

// One order per brand. A checkout with items from 3 brands creates 3 orders
// sharing the same `checkoutId`, so each brand only sees (and ships) its own items.
const orderSchema = new mongoose.Schema(
    {
        checkoutId: { type: String, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
        brand: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
        brandName: String,
        items: [orderItemSchema],
        shipping: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, default: "" },
            notes: { type: String, default: "" },
        },
        paymentMethod: { type: String, enum: ["cod"], default: "cod" },
        itemsTotal: { type: Number, required: true },
        shippingFee: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: { type: String, enum: ORDER_STATUS, default: "pending", index: true },
    },
    { timestamps: true }
)

export default mongoose.model("order", orderSchema)
