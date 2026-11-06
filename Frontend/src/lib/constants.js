export const SITE_NAME = 'Naqsh'

export const CATEGORIES = [
  'Open Abaya', 'Closed Abaya', 'Kimono Abaya', 'Butterfly Abaya', 'Embroidered',
  'Occasion Wear', 'Everyday', 'Kaftan', 'Hijab & Scarves', 'Accessories',
]

// fabric colours reused for category swatches and empty product images
export const FABRICS = ['#1D2838', '#7B2D4B', '#69724F', '#B59A66', '#4A5565', '#3B2A3F']

export const ORDER_STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
}

export const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const SIZE_PRESETS = ['50', '52', '54', '56', '58', '60']
