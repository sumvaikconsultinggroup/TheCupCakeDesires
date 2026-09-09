import mongoose, { Document, Schema } from 'mongoose'

export interface ICartItem {
    id?: string
    productId: string
    productName: string
    handle?: string
    category?: string
    imageUrl?: string
    price: number
    quantity: number
    minOrderQty?: number
    variant?: {
        id: string
        name: string
        option1Value?: string
        option2Value?: string
        option3Value?: string
        sku?: string
    }
    variants?: {
        name: string
        option: string
    }[]
}

export interface ICart extends Document {
    cartId: string
    
    // User identification
    userId?: string // Clerk user ID if logged in
    sessionId?: string // For guest users
    email?: string
    userName?: string
    phoneNumber?: string
    firstName?: string
    lastName?: string
    shippingAddress?: {
        line1?: string
        city?: string
        state?: string
        country?: string
        zipcode?: string
        addressType?: string
    }
    shipping?: number
    paymentMethod?: string
    delivery?: {
        date?: string
        slot?: string
        instructions?: string
        postcode?: string
    }
    
    // Cart data
    items: ICartItem[]
    totalValue: number
    subtotal?: number
    taxes?: number
    
    // Workflow status
    status: 'active' | 'checkout_started' | 'payment_started' | 'abandoned' | 'converted' | 'expired'
    checkoutStage?: 'cart' | 'checkout' | 'ready_to_pay' | 'payment_started'
    pendingOrderId?: string
    pendingOrderNumber?: string
    
    // Timestamps
    lastUpdated: Date
    checkoutStartedAt?: Date
    readyToPayAt?: Date
    paymentStartedAt?: Date
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
        id: { type: String },
        productName: { type: String, required: true },
        handle: { type: String },
        category: { type: String },
        imageUrl: { type: String },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        minOrderQty: { type: Number, min: 1 },
        variant: {
            id: String,
            name: String,
            option1Value: String,
            option2Value: String,
            option3Value: String,
            sku: String,
        },
        variants: [
            {
                name: String,
                option: String,
            },
        ],
        logoUrls: [{ type: String }],
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
        firstName: { type: String },
        lastName: { type: String },
        shippingAddress: {
            line1: String,
            city: String,
            state: String,
            country: String,
            zipcode: String,
            addressType: String,
        },
        delivery: {
            date: String,
            slot: String,
            instructions: String,
            postcode: String,
        },
        
        // Cart data
        items: {
            type: [CartItemSchema],
            required: true,
            validate: [(val: ICartItem[]) => val.length > 0, 'Cart must have at least one item'],
        },
        totalValue: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, min: 0 },
        taxes: { type: Number, min: 0 },
        shipping: { type: Number, min: 0 },
        paymentMethod: { type: String },
        
        // Workflow status
        status: {
            type: String,
            enum: ['active', 'checkout_started', 'payment_started', 'abandoned', 'converted', 'expired'],
            default: 'active',
            index: true,
        },
        checkoutStage: {
            type: String,
            enum: ['cart', 'checkout', 'ready_to_pay', 'payment_started'],
            default: 'cart',
            index: true,
        },
        pendingOrderId: { type: String, index: true },
        pendingOrderNumber: { type: String },
        
        // Timestamps
        lastUpdated: { type: Date, required: true, default: Date.now, index: true },
        checkoutStartedAt: { type: Date },
        readyToPayAt: { type: Date },
        paymentStartedAt: { type: Date },
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
    } else if (this.status === 'checkout_started' || this.status === 'payment_started') {
        return diffMinutes > 20 // Checkout / unpaid Stripe stale after 20 min
    }
    return false
})

// Method to calculate cart abandonment time
CartSchema.methods.shouldBeAbandoned = function(this: ICart): boolean {
    const now = new Date()
    const diffMinutes = (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60)
    
    if (this.status === 'active' && diffMinutes >= 60) {
        return true // Active cart abandoned after 60 min
    } else if ((this.status === 'checkout_started' || this.status === 'payment_started') && diffMinutes >= 20) {
        return true
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
