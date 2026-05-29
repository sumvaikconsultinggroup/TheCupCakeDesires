import mongoose, { Document, Schema } from 'mongoose'

export interface IAWBOrder extends Document {
  orderId: string // Order orderId field
  awb: string // AWB number
  createdAt: Date
  updatedAt: Date
}

const awbOrderSchema = new Schema<IAWBOrder>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    awb: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
)

// Create indexes
awbOrderSchema.index({ orderId: 1 })
awbOrderSchema.index({ awb: 1 })
awbOrderSchema.index({ orderId: 1, awb: 1 }, { unique: true }) // Ensure one AWB per order

export default mongoose.models.AWBOrder || mongoose.model<IAWBOrder>('AWBOrder', awbOrderSchema)
