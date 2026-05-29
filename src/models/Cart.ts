import mongoose, { Document, Schema } from 'mongoose'

export interface ICartItem {
    productId: string
    productName: string
    imageUrl?: string
    price: number
    quantity: number
    variant?: {
        id: string
        name: string
        option1Value?: string
        option2Value?: string
        option3Value?: string
        sku?: string
    }
}

export interface ICart extends Document {
    cartId: string
    
    // User identification
    userId?: string // Clerk user ID if logged in
    sessionId?: string // For guest users
    email?: string
    userName?: string
    phoneNumber?: string
    
    // Cart data
    items: ICartItem[]
    totalValue: number
    
    // Workflow status
    status: 'active' | 'checkout_started' | 'abandoned' | 'converted' | 'expired'
    
    // Timestamps
    lastUpdated: Date
    checkoutStartedAt?: Date
    abandonedAt?: Date
    convertedAt?: Date
    
    // Recovery tracking
    recoveryAttempts: {
        attemptNumber: number // 1, 2, 3
        type: 'email' | 'whatsapp' | 'push'
        sentAt: Date
        opened?: boolean
        clicked?: boolean
    }[]
    
    // Metadata
    ipAddress?: string
    userAgent?: string
    
    // Promo code if applied
    promoCode?: string
    discount?: number
    
    createdAt: Date
    updatedAt: Date
}

const CartItemSchema = new Schema(
    {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        imageUrl: { type: String },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        variant: {
            id: String,
            name: String,
            option1Value: String,
            option2Value: String,
            option3Value: String,
            sku: String,
        },
    },
    { _id: false }
)

const RecoveryAttemptSchema = new Schema(
    {
        attemptNumber: { type: Number, required: true },
        type: { type: String, enum: ['email', 'whatsapp', 'push'], required: true },
        sentAt: { type: Date, required: true, default: Date.now },
        opened: { type: Boolean, default: false },
        clicked: { type: Boolean, default: false },
    },
    { _id: false }
)

const CartSchema = new Schema(
    {
        cartId: { type: String, required: true, unique: true, index: true },
        
        // User identification
        userId: { type: String, index: true },
        sessionId: { type: String, index: true },
        email: { type: String, index: true },
        userName: { type: String },
        phoneNumber: { type: String },
        
        // Cart data
        items: {
            type: [CartItemSchema],
            required: true,
            validate: [(val: ICartItem[]) => val.length > 0, 'Cart must have at least one item'],
        },
        totalValue: { type: Number, required: true, min: 0 },
        
        // Workflow status
        status: {
            type: String,
            enum: ['active', 'checkout_started', 'abandoned', 'converted', 'expired'],
            default: 'active',
            index: true,
        },
        
        // Timestamps
        lastUpdated: { type: Date, required: true, default: Date.now, index: true },
        checkoutStartedAt: { type: Date },
        abandonedAt: { type: Date, index: true },
        convertedAt: { type: Date },
        
        // Recovery tracking
        recoveryAttempts: [RecoveryAttemptSchema],
        
        // Metadata
        ipAddress: { type: String },
        userAgent: { type: String },
        
        // Promo code
        promoCode: { type: String },
        discount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
)

// Compound indexes for efficient queries
CartSchema.index({ status: 1, lastUpdated: -1 })
CartSchema.index({ status: 1, abandonedAt: -1 })
CartSchema.index({ userId: 1, status: 1 })
CartSchema.index({ sessionId: 1, status: 1 })
CartSchema.index({ email: 1, status: 1 })

// TTL index to auto-delete expired carts after 30 days
CartSchema.index(
    { abandonedAt: 1 },
    {
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        partialFilterExpression: { status: 'expired' }
    }
)

// TTL index for converted carts (keep for 90 days for analytics)
CartSchema.index(
    { convertedAt: 1 },
    {
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    }
)

// Virtual for checking if cart is stale
CartSchema.virtual('isStale').get(function(this: ICart) {
    const now = new Date()
    const diffMinutes = (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60)
    
    if (this.status === 'active') {
        return diffMinutes > 60 // Active cart stale after 60 min
    } else if (this.status === 'checkout_started') {
        return diffMinutes > 20 // Checkout stale after 20 min
    }
    return false
})

// Method to calculate cart abandonment time
CartSchema.methods.shouldBeAbandoned = function(this: ICart): boolean {
    const now = new Date()
    const diffMinutes = (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60)
    
    if (this.status === 'active' && diffMinutes >= 60) {
        return true // Active cart abandoned after 60 min
    } else if (this.status === 'checkout_started' && diffMinutes >= 20) {
        return true // Checkout abandoned after 20 min
    }
    
    return false
}

// Method to mark cart as abandoned
CartSchema.methods.markAbandoned = async function(this: ICart) {
    this.status = 'abandoned'
    this.abandonedAt = new Date()
    await this.save()
}

// Method to mark cart as converted
CartSchema.methods.markConverted = async function(this: ICart) {
    this.status = 'converted'
    this.convertedAt = new Date()
    await this.save()
}

// Method to mark cart as expired
CartSchema.methods.markExpired = async function(this: ICart) {
    this.status = 'expired'
    await this.save()
}

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema)
