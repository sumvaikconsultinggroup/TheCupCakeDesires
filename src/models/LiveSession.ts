import mongoose from 'mongoose'

const LiveSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  visitorId: { type: String, index: true }, // persistent across sessions
  
  // Location data
  ip: String,
  city: String,
  region: String,
  country: String,
  latitude: Number,
  longitude: Number,
  
  // Device info
  device: { type: String, enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' },
  browser: String,
  os: String,
  userAgent: String,
  
  // Session state
  currentPage: String,
  referrer: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  
  // Cart state
  cartItems: { type: Number, default: 0 },
  cartValue: { type: Number, default: 0 },
  cartProducts: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
  }],
  
  // Status
  status: { 
    type: String, 
    enum: ['browsing', 'cart', 'checkout', 'purchased', 'abandoned'],
    default: 'browsing'
  },
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  endedAt: Date,
  
  // Metrics
  pageViews: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // in seconds
  
  // Customer link (if logged in)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerEmail: String,
  
}, { timestamps: true })

// Index for active sessions query
LiveSessionSchema.index({ lastActiveAt: -1 })
LiveSessionSchema.index({ status: 1, lastActiveAt: -1 })

// Auto-expire sessions after 30 minutes of inactivity
LiveSessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 1800 })

const LiveSession = mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema)

export default LiveSession
