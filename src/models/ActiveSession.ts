import mongoose, { Document, Schema } from 'mongoose'

export interface ISessionCartItem {
    productId: string
    productName: string
    price: number
    quantity: number
}

export interface IActiveSession extends Document {
    sessionId: string // Unique session identifier
    userId?: string // Clerk user ID if logged in
    guestId?: string // For anonymous users
    userName?: string
    email?: string
    ipAddress?: string
    userAgent?: string
    currentPage: string
    cartItems: ISessionCartItem[]
    cartValue: number
    lastActivityAt: Date
    startedAt: Date
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const SessionCartItemSchema = new Schema(
    {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
    },
    { _id: false }
)

const ActiveSessionSchema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, index: true },
        guestId: { type: String, index: true },
        userName: { type: String },
        email: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
        currentPage: { type: String, required: true },
        cartItems: {
            type: [SessionCartItemSchema],
            default: [],
        },
        cartValue: { type: Number, default: 0, min: 0 },
        lastActivityAt: { type: Date, required: true, default: Date.now },
        startedAt: { type: Date, required: true, default: Date.now },
        isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
)

// Note: isActive index already created by field definition with index: true (line 55)

// TTL index to auto-delete inactive sessions after 10 minutes
// Note: This is a single-field index required for TTL expiration
// Queries can still use this index for sorting by lastActivityAt
ActiveSessionSchema.index(
    { lastActivityAt: 1 },
    {
        name: 'lastActivityAt_ttl_index', // Explicit name to avoid conflicts
        expireAfterSeconds: 10 * 60, // 10 minutes (user's requirement: 5-10 min)
        partialFilterExpression: { isActive: false }
    }
)

export default mongoose.models.ActiveSession ||
    mongoose.model<IActiveSession>('ActiveSession', ActiveSessionSchema)
