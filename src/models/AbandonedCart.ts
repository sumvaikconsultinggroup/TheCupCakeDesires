import mongoose, { Document, Schema } from 'mongoose'

export interface IAbandonedCartItem {
    id?: string
    productId: string
    productName: string
    handle?: string
    category?: string
    imageUrl?: string
    price: number
    quantity: number
    variant?: {
        id: string
        name: string
        option1Value?: string
        option2Value?: string
    }
    variants?: {
        name: string
        option: string
    }[]
}

export interface IAbandonedCart extends Document {
    userId?: string // Clerk user ID if logged in
    guestId?: string // For anonymous users
    email?: string
    userName?: string
    cartItems: IAbandonedCartItem[]
    totalValue: number
    status: 'abandoned' | 'recovered' | 'expired'
    abandonedAt: Date
    lastUpdatedAt: Date
    recoveryEmailSent: boolean
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
}

const AbandonedCartItemSchema = new Schema(
    {
        productId: { type: String, required: true },
        id: { type: String },
        productName: { type: String, required: true },
        handle: { type: String },
        category: { type: String },
        imageUrl: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        variant: {
            id: String,
            name: String,
            option1Value: String,
            option2Value: String,
        },
        variants: [
            {
                name: String,
                option: String,
            },
        ],
    },
    { _id: false }
)

const AbandonedCartSchema = new Schema(
    {
        userId: { type: String, index: true },
        guestId: { type: String, index: true },
        email: { type: String, index: true },
        userName: { type: String },
        cartItems: {
            type: [AbandonedCartItemSchema],
            required: true,
            validate: [(val: IAbandonedCartItem[]) => val.length > 0, 'Cart must have at least one item'],
        },
        totalValue: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['abandoned', 'recovered', 'expired'],
            default: 'abandoned',
            index: true,
        },
        abandonedAt: { type: Date, required: true, default: Date.now, index: true },
        lastUpdatedAt: { type: Date, required: true, default: Date.now },
        recoveryEmailSent: { type: Boolean, default: false },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
)

// Index for efficient queries
AbandonedCartSchema.index({ status: 1, abandonedAt: -1 })
AbandonedCartSchema.index({ email: 1, status: 1 })

// TTL index to auto-delete expired carts after 30 days
AbandonedCartSchema.index(
    { abandonedAt: 1 },
    {
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        partialFilterExpression: { status: 'expired' }
    }
)

export default mongoose.models.AbandonedCart ||
    mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema)
