import axios from 'axios'

// All requests go through this instance. The JWT lives in an httpOnly cookie,
// so withCredentials must stay on.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  registerBrand: (formData) => api.post('/auth/register-brand', formData),
  logout: () => api.post('/auth/logout'),
}

export const productApi = {
  list: (params) => api.get('/product', { params }),
  one: (id) => api.get(`/product/${id}`),
  mine: () => api.get('/product/mine'),
  create: (formData) => api.post('/product/create', formData),
  update: (id, formData) => api.put(`/product/${id}`, formData),
  remove: (id) => api.delete(`/product/${id}`),
  reviews: (id) => api.get(`/product/${id}/reviews`),
  addReview: (id, data) => api.post(`/product/${id}/reviews`, data),
  deleteReview: (id, reviewId) => api.delete(`/product/${id}/reviews/${reviewId}`),
}

export const cartApi = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/items', data),
  setQty: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
}

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (id) => api.post(`/wishlist/${id}`),
  remove: (id) => api.delete(`/wishlist/${id}`),
}

export const orderApi = {
  checkout: (data) => api.post('/orders/checkout', data),
  mine: () => api.get('/orders/mine'),
  cancel: (id) => api.patch(`/orders/mine/${id}/cancel`),
  brandList: () => api.get('/orders/brand/list'),
  brandStats: () => api.get('/orders/brand/stats'),
  setStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}

export const brandApi = {
  list: () => api.get('/brands'),
  one: (id) => api.get(`/brands/${id}`),
}

export const superApi = {
  stats: () => api.get('/superadmin/stats'),
  brands: () => api.get('/superadmin/brands'),
  deleteBrand: (id) => api.delete(`/superadmin/brands/${id}`),
  users: () => api.get('/superadmin/users'),
  deleteUser: (id) => api.delete(`/superadmin/users/${id}`),
  orders: () => api.get('/superadmin/orders'),
}

export default api
