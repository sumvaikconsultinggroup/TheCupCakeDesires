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
        option3Value?: string
        sku?: string
        price?: number
    }
    variants?: {
        name: string
        option: string
    }[]
    sku?: string
    logoUrls?: string[]
    minOrderQty?: number
}

export interface IAbandonedCart extends Document {
    userId?: string // Clerk user ID if logged in
    guestId?: string // For anonymous users
    email?: string
    userName?: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
    isGuest?: boolean
    cartItems: IAbandonedCartItem[]
    totalValue: number
    subtotal?: number
    discount?: number
    shipping?: number
    taxes?: number
    promoCode?: string
    paymentMethod?: string
    shippingAddress?: {
        line1?: string
        city?: string
        state?: string
        country?: string
        zipcode?: string
        addressType?: string
    }
    delivery?: {
        date?: string
        slot?: string
        instructions?: string
        postcode?: string
    }
    checkoutStage?: 'cart' | 'checkout' | 'ready_to_pay' | 'payment_started'
    pendingOrderId?: string
    pendingOrderNumber?: string
    status: 'abandoned' | 'recovered' | 'expired'
    abandonedAt: Date
    lastUpdatedAt: Date
    checkoutStartedAt?: Date
    readyToPayAt?: Date
    paymentStartedAt?: Date
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
            option3Value: String,
            sku: String,
            price: Number,
        },
        variants: [
            {
                name: String,
                option: String,
            },
        ],
        sku: { type: String },
        logoUrls: [{ type: String }],
        minOrderQty: { type: Number },
    },
    { _id: false }
)

const AbandonedCartSchema = new Schema(
    {
        userId: { type: String, index: true },
        guestId: { type: String, index: true },
        email: { type: String, index: true },
        userName: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        phoneNumber: { type: String },
        isGuest: { type: Boolean, default: true },
        cartItems: {
            type: [AbandonedCartItemSchema],
            required: true,
            validate: [(val: IAbandonedCartItem[]) => val.length > 0, 'Cart must have at least one item'],
        },
        totalValue: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, min: 0 },
        discount: { type: Number, min: 0 },
        shipping: { type: Number, min: 0 },
        taxes: { type: Number, min: 0 },
        promoCode: { type: String },
        paymentMethod: { type: String },
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
        checkoutStage: {
            type: String,
            enum: ['cart', 'checkout', 'ready_to_pay', 'payment_started'],
            default: 'cart',
            index: true,
        },
        pendingOrderId: { type: String, index: true },
        pendingOrderNumber: { type: String },
        status: {
            type: String,
            enum: ['abandoned', 'recovered', 'expired'],
            default: 'abandoned',
            index: true,
        },
        abandonedAt: { type: Date, required: true, default: Date.now, index: true },
        lastUpdatedAt: { type: Date, required: true, default: Date.now },
        checkoutStartedAt: { type: Date },
        readyToPayAt: { type: Date },
        paymentStartedAt: { type: Date },
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
