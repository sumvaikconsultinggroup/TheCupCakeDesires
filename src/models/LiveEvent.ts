import mongoose from 'mongoose'

const LiveEventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  visitorId: String,
  
  // Event type
  type: {
    type: String,
    required: true,
    enum: [
      'session_start',
      'session_end',
      'page_view',
      'scroll',
      'click',
      'add_to_cart',
      'remove_from_cart',
      'update_cart',
      'checkout_start',
      'checkout_step',
      'payment_start',
      'payment_success',
      'payment_failed',
      'purchase',
      'cart_abandon',
      'search',
      'product_view',
      'collection_view',
      'wishlist_add',
      'wishlist_remove',
      'coupon_apply',
      'coupon_remove',
    ],
    index: true
  },
  
  // Event data
  data: {
    // Page view
    page: String,
    title: String,
    referrer: String,
    
    // Product/Cart
    productId: String,
    productName: String,
    productPrice: Number,
    quantity: Number,
    
    // Cart totals
    cartItems: Number,
    cartValue: Number,
    
    // Search
    searchQuery: String,
    searchResults: Number,
    
    // Checkout
    checkoutStep: String,
    paymentMethod: String,
    
    // Order
    orderId: String,
    orderTotal: Number,
    
    // Coupon
    couponCode: String,
    discountAmount: Number,
    
    // Custom data
    custom: mongoose.Schema.Types.Mixed,
  },
  
  // Location at time of event
  city: String,
  country: String,
  
  // Timestamp
  timestamp: { type: Date, default: Date.now, index: true },
  
}, { timestamps: true })

// Compound index for analytics queries
LiveEventSchema.index({ type: 1, timestamp: -1 })
LiveEventSchema.index({ sessionId: 1, timestamp: -1 })

// TTL index - keep events for 7 days
LiveEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 })

const LiveEvent = mongoose.models.LiveEvent || mongoose.model('LiveEvent', LiveEventSchema)

export default LiveEvent
