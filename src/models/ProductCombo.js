// c:\Users\dell\Desktop\gibbon-ecomm\src\models\ProductCombo.js

import mongoose from 'mongoose'
const { Schema, model, models } = mongoose

/* ---------------- Combo Item Schema ---------------- */

const comboItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    // Reference to Product.variants._id
    variantId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    // Variant details snapshot
    variantDetails: {
      option1Value: String,
      option2Value: String,
      option3Value: String,
      sku: String,
      image: String,
    },

    // Snapshots (important for historical consistency)
    titleSnapshot: {
      type: String,
      required: true,
    },

    imageSnapshot: {
      type: String,
    },

    priceSnapshot: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
)

/* ---------------- Product Combo Schema ---------------- */

const productComboSchema = new Schema(
  {
    handle: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: String,

    image: String, // Main combo image

    items: {
      type: [comboItemSchema],
      validate: [(v) => v.length >= 2, 'A combo must contain at least 2 products'],
    },

    // Calculated values
    totalOriginalPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },

    totalQuantity: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0, // flat discount
    },

    discountPercentage: {
      type: Number,
      default: 0, // calculated percentage
    },

    savingsAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'active',
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    seo: {
      title: String,
      description: String,
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
        noarchive: { type: Boolean, default: false },
        nosnippet: { type: Boolean, default: false },
        noimageindex: { type: Boolean, default: false }
      },
      canonical: String
    },
  },
  { timestamps: true, versionKey: false }
)

/* ---------------- Auto Recalculate Totals ---------------- */

productComboSchema.pre('save', function (next) {
  // Calculate total original price
  this.totalOriginalPrice = this.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)

  // Calculate total quantity
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0)

  // Apply discount
  if (this.discount > 0) {
    this.totalPrice = Math.max(this.totalOriginalPrice - this.discount, 0)
    this.savingsAmount = this.discount
    this.discountPercentage = Math.round((this.discount / this.totalOriginalPrice) * 100)
  } else {
    this.totalPrice = this.totalOriginalPrice
    this.savingsAmount = 0
    this.discountPercentage = 0
  }

  // Set main image if not provided
  if (!this.image && this.items.length > 0) {
    this.image = this.items[0].imageSnapshot
  }

  next()
})

/* ---------------- Indexes ---------------- */

productComboSchema.index({ status: 1 })
productComboSchema.index({ isDeleted: 1 })
productComboSchema.index({ createdAt: -1 })

/* ---------------- Model Export ---------------- */

const ProductCombo = models.ProductCombo || model('ProductCombo', productComboSchema)

export default ProductCombo