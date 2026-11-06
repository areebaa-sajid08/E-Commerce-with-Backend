export const ROLES = { USER: "user", ADMIN: "admin", SUPERADMIN: "superadmin" }

export const CATEGORIES = [
    "Open Abaya",
    "Closed Abaya",
    "Kimono Abaya",
    "Butterfly Abaya",
    "Embroidered",
    "Occasion Wear",
    "Everyday",
    "Kaftan",
    "Hijab & Scarves",
    "Accessories",
]

export const ORDER_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

// which status a brand/superadmin may move an order to, from the current one
export const STATUS_FLOW = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
}
