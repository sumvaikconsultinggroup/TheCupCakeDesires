import mongoose from 'mongoose'

/* ===========================
   ADDRESS SNAPSHOT
=========================== */
const addressSchema = new mongoose.Schema(
  {
    type: String, // home | office
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    address: String,
    address1: String,
    city: String,
    state: String,
    country: String,
    zipcode: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{6}$/.test(v)
        },
        message: 'Zipcode must be exactly 6 digits',
      },
    },
  },
  { _id: false, versionKey: false }
)

/* ===========================
   USER SNAPSHOT
=========================== */
const userSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    gender: String,
    dob: Date,

    addresses: [addressSchema], // user addresses snapshot at checkout
  },
  { _id: true, versionKey: false }
)

/* ===========================
   PRODUCT VARIANT SNAPSHOT
=========================== */
const variantSnapshotSchema = new mongoose.Schema(
  {
    option1Value: String,
    option2Value: String,
    option3Value: String,

    sku: String,
    price: Number,
    compareAtPrice: Number,

    flavour: String,
    netWeight: String,
    image: String,
  },
  { _id: false, versionKey: false }
)

/* ===========================
   PRODUCT SNAPSHOT
=========================== */
const orderProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

    handle: String,
    title: String,
    vendor: String,
    productCategory: String,

    variant: variantSnapshotSchema, // snapshot of variant chosen
    quantity: { type: Number, required: true },

    totalPrice: Number, // quantity * variant.price
  },
  { _id: false, versionKey: false }
)

/* ===========================
   PAYMENT SNAPSHOT (Stripe)
=========================== */
const paymentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
  },

  method: String,

  // Stripe references (populated by /api/stripe/webhook on checkout.session.completed)
  stripeSessionId: String,
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  cardLast4: String,
  cardNetwork: String,

  amount: Number,
  currency: { type: String, default: 'AUD' },
})

/* ===========================
   SHIPPING DETAILS (Shiprocket)
=========================== */
const shippingDetailsSchema = new mongoose.Schema(
  {
    shiprocket_order_id: String,
    shiprocket_shipment_id: String,
    awb_code: String,
    courier_name: String,
    tracking_url: String,
  },
  { _id: false, versionKey: false }
)

/* ===========================
   RETURN DETAILS
=========================== */
const returnDetailsSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['initiated', 'pickup_scheduled', 'in_transit', 'delivered', 'completed', 'cancelled'],
    },
    reason: String,
    shiprocket_return_order_id: String,
    shiprocket_return_awb: String,
    return_tracking_url: String,
  },
  { _id: false, versionKey: false }
)

/* ===========================
   STATUS HISTORY (optional but recommended)
=========================== */
const statusLogSchema = new mongoose.Schema(
  {
    status: String,
    timestamp: { type: Date, default: Date.now },
    message: String, // admin note or auto-tracking message
  },
  { _id: false, versionKey: false }
)

/* ===========================
   ITEM VARIANT SCHEMA (for items array)
=========================== */
const itemVariantSchema = new mongoose.Schema(
  {
    name: String, // e.g., 'Option 1', 'Option 2', 'Option 3'
    option: String, // the actual value
  },
  { _id: false, versionKey: false }
)

/* ===========================
   ORDER ITEM SCHEMA (for items array)
=========================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: String,
    name: String,
    imageUrl: String,
    quantity: { type: Number, required: true },
    price: Number,
    variants: [itemVariantSchema],
  },
  { _id: false, versionKey: false }
)

/* ===========================
   SHIPPING ADDRESS SCHEMA
=========================== */
const shippingAddressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    postalCode: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{6}$/.test(v)
        },
        message: 'Postal code must be exactly 6 digits',
      },
    },
    country: { type: String, default: 'India' },
  },
  { _id: false, versionKey: false }
)

/* ===========================
   PAYMENT DETAILS SCHEMA
=========================== */
const paymentDetailsSchema = new mongoose.Schema(
  {
    paymentMethod: { type: String, enum: ['cod', 'prepaid'], default: 'prepaid' },
    transactionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    gateway: String, // Payment gateway used (currently 'Stripe' only)
    paidAt: Date, // Timestamp when payment was completed
  },
  { _id: false, versionKey: false }
)

/* ===========================
   NOTE SCHEMA
=========================== */
const noteSchema = new mongoose.Schema(
  {
    content: String,
    author: String,
    isInternal: Boolean,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false }
)

/* ===========================
   MAIN ORDER SCHEMA
=========================== */
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      // Using unique creates an index automatically, so no need for separate index: true
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
    },

    // User identification
    userId: String, // clerkId or user _id as string

    // Legacy user snapshot (kept for backward compatibility)
    user: userSnapshotSchema, // snapshot of user

    // Items array (new format used in create-order)
    items: [orderItemSchema],

    totalAmount: { type: Number, required: true },
    couponCode: String,

    // Payment details (new format used in create-order)
    paymentDetails: paymentDetailsSchema,

    // Legacy payment schema (kept for backward compatibility)
    payment: paymentSchema,

    shippingDetails: shippingDetailsSchema,

    returnDetails: returnDetailsSchema,

    // Status
    status: {
      type: String,
      enum: [
        'order_created', // When user creates order
        'paid', // Prepaid orders (payment completed)
        'cod', // Cash on Delivery orders
        'pending',
        'pending_payment',
        'confirmed', // After admin confirms
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refund_initiated', // Paid order cancelled, refund process started
        'refunded', // Refund completed
        'return_initiated',
        'return_completed',
        'expired',
      ],
      default: 'order_created',
    },

    // Shipping address (new format used in create-order)
    shippingAddress: shippingAddressSchema,

    // Legacy delivery address (kept for backward compatibility)
    deliveryAddress: addressSchema, // final delivery address snapshot

    // Status logs (initialize as empty array by default)
    statusLogs: {
      type: [statusLogSchema],
      default: [],
    },

    // Expiration for pending orders
    expiresAt: Date,

    notes: {
      type: [noteSchema],
      default: [],
    },

    // Invoice fields
    invoiceNumber: String,
    invoiceGeneratedAt: Date,

    // Additional fields used in invoice generation
    subtotal: Number,
    discount: Number,
    discountCode: String,
    shipping: Number,
    taxes: Number,

    // GST details for tax invoice (optional, GST is INCLUSIVE in product prices @ 5%)
    gstDetails: {
      gstRate: Number,
      taxableValue: Number,
      cgst: Number,
      sgst: Number,
      igst: Number,
      isIntraState: Boolean,
      placeOfSupply: String,
    },

    // Timeline for admin tracking
    timeline: {
      type: [
        {
          eventType: String, // Renamed from 'type' to avoid Mongoose conflict
          title: String,
          description: String,
          user: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // Additional customer/address fields referenced in invoice API
    customer: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
    billingAddress: addressSchema,

    // Guest account creation data (temporary)
    guestAccountData: {
      email: String,
      password: String,
      name: String,
      phone: String,
      address: Object,
      createAccount: Boolean,
    },

    // ── Admin / Risk fields ────────────────────────────────────────────────────

    // Freeform tags for admin organisation (e.g. 'vip', 'fraud-watch')
    tags: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    // Risk assessment
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },

    // Risk reason codes produced by the risk-scoring route (or overridden by admin)
    riskReasons: {
      type: [{ type: String }],
      default: [],
    },

    // Admin user assigned to manage this order
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    // Disable autoIndex in production to avoid duplicate index warnings
    // Indexes should be created manually in production via migrations
    autoIndex: process.env.NODE_ENV !== 'production',
  }
)

// Note: orderId already has unique and sparse index from field definition above
// The unique: true option automatically creates an index, no need for explicit schema.index()

// In development, delete the cached model to ensure schema updates are picked up
if (process.env.NODE_ENV !== 'production' && mongoose.models.Order) {
  delete mongoose.models.Order
}

// Compound indexes for common query patterns
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ 'paymentDetails.paymentStatus': 1 })

// Admin / risk indexes
orderSchema.index({ tags: 1 })
orderSchema.index({ riskLevel: 1, status: 1 })
orderSchema.index({ assignedTo: 1, status: 1 })

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
