const nf = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })
export const money = (n) => `PKR ${nf.format(Math.round(n || 0))}`
export const dateLabel = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const brandName = (admin) => admin?.brand?.name || admin?.username || 'Independent brand'
export const apiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : fallback)
