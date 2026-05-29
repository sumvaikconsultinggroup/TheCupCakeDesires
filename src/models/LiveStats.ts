import mongoose from 'mongoose'

const LiveStatsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  hour: Number, // 0-23 for hourly breakdowns
  
  // Visitor counts
  totalVisitors: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  returningVisitors: { type: Number, default: 0 },
  
  // Page views
  totalPageViews: { type: Number, default: 0 },
  
  // Cart metrics
  cartsCreated: { type: Number, default: 0 },
  cartsAbandoned: { type: Number, default: 0 },
  abandonedValue: { type: Number, default: 0 },
  
  // Checkout metrics
  checkoutsStarted: { type: Number, default: 0 },
  checkoutsCompleted: { type: Number, default: 0 },
  
  // Revenue
  ordersCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  
  // Conversion
  conversionRate: { type: Number, default: 0 },
  
  // Traffic sources
  trafficSources: {
    direct: { type: Number, default: 0 },
    organic: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
  },
  
  // Device breakdown
  devices: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
  },
  
  // Top pages
  topPages: [{
    page: String,
    views: Number,
  }],
  
  // Top products viewed
  topProducts: [{
    productId: String,
    name: String,
    views: Number,
    addedToCart: Number,
  }],
  
  // Geographic data
  topCities: [{
    city: String,
    country: String,
    visitors: Number,
  }],
  
}, { timestamps: true })

LiveStatsSchema.index({ date: -1 })

const LiveStats = mongoose.models.LiveStats || mongoose.model('LiveStats', LiveStatsSchema)

export default LiveStats
