# Naqsh: abaya marketplace

`Backend/`  Express + MongoDB + ImageKit API
`Frontend/` React + Tailwind v4 + GSAP + axios (Vite)

## 1. Backend

```bash
cd Backend
npm install   # includes passport, passport-google-oauth20 and socket.io
```

All keys are in `Backend/.env` (never commit it; it is in `.gitignore`).
`Backend/.env.example` lists every variable.

**Rotate your keys.** The old MongoDB password, JWT secret and ImageKit key
were hard-coded in files you shared, so create new ones and put them in `.env`.

Create the super admin (once). First set `SUPERADMIN_EMAIL` and a real
`SUPERADMIN_PASSWORD` in `.env`, then:

```bash
npm run seed:admin
npm run dev          # http://localhost:3000
```

### Google sign-in (optional)

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
2. Authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (use your real API URL in production).
3. Put the client ID and secret in `Backend/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and restart the backend.

New Google users become customers. If the Google email already has an account, Google is linked to it
(so a brand can also sign in with Google). The super admin can only sign in with email and password.
Brands still open their shop at `/register-brand`.

## 2. Frontend

```bash
cd Frontend
npm install axios gsap @gsap/react lenis react-router-dom socket.io-client tailwindcss @tailwindcss/vite
npm run dev          # http://localhost:5173
```

Vite proxies `/api` to the backend, so the login cookie works with no CORS setup.
For production set `VITE_API_URL` (see `.env.example`) and `CLIENT_URL` on the backend.

## Roles

| Role | How it is created | Can do |
|------|-------------------|--------|
| customer (`user`) | /register | browse, bag, wishlist, checkout, reviews |
| brand (`admin`) | /register-brand | everything a customer can, plus add / edit / delete own products and manage orders for them |
| `superadmin` | `npm run seed:admin` only | delete any brand (and its products), product, customer or review; update any order |

## Real-time (Socket.IO)

The backend and frontend share one socket connection, so nobody needs to refresh:

| Who | Sees instantly |
|-----|----------------|
| everyone | new, edited (price, stock, photos, rating) and deleted products; new reviews; brands joining or removed |
| a customer | bag synced across tabs and devices; price/stock changes and removed items in the bag; order status changes; saved list |
| a brand | new orders (with a pop-up), status changes, stock dropping as pieces sell |
| the super admin | every signup, brand, product and order change in the panel |

Deleting an account signs its open tabs out immediately. After a dropped connection the pages refetch by themselves.
In development Vite proxies `/socket.io` to the backend; in production set `VITE_SOCKET_URL` (frontend) and `CLIENT_URL` (backend).
Install the new packages: `socket.io` in `Backend`, `socket.io-client` in `Frontend`.

Brands cannot buy their own products. Payment is cash on delivery (PKR).
A checkout with items from several brands creates one order per brand.

## API (all under /api)

- `auth`: POST register, register-brand, login, logout; GET me
- `product`: GET / (q, category, brand, minPrice, maxPrice, sort, inStock, sale, page, limit), GET /:id, GET /mine, POST /create, PUT /:id, DELETE /:id; reviews at /:id/reviews
- `cart`: GET /, POST /items, PATCH /items/:itemId (quantity), DELETE /items/:itemId, DELETE /
- `wishlist`: GET /, POST /:productId, DELETE /:productId
- `orders`: POST /checkout, GET /mine, PATCH /mine/:id/cancel, GET /brand/list, GET /brand/stats, PATCH /:id/status
- `brands`: GET /, GET /:id
- `superadmin`: GET /stats, GET /brands, DELETE /brands/:id, GET /users, DELETE /users/:id, GET /orders

## Change the site name

`Frontend/src/lib/constants.js` → `SITE_NAME` (also the `<title>` in `index.html`).
