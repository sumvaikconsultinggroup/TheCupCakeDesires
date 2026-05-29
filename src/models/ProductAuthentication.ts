// src/models/ProductAuthentication.ts

import { Document, Schema, model, models } from 'mongoose'

export interface IProductAuthentication extends Document {
  authCode: string
  verificationCount: number
  verificationHistory: Array<{
    verifiedAt: Date
    ip?: string
  }>
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductAuthenticationSchema = new Schema<IProductAuthentication>(
  {
    authCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    verificationHistory: [
      {
        verifiedAt: { type: Date, default: Date.now },
        ip: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
)

const ProductAuthentication =
  models.ProductAuthentication || model<IProductAuthentication>('ProductAuthentication', ProductAuthenticationSchema)

export default ProductAuthentication
