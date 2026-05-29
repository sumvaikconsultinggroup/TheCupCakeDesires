import mongoose, { Document, Schema } from 'mongoose'

export interface IAWB extends Document {
  orderId: string // Reference to Order _id
  orderOrderId?: string // Reference to Order orderId field
  awbCode: string
  courierName: string
  courierId?: number
  trackingUrl?: string
  shiprocketOrderId?: string
  shiprocketShipmentId?: string
  status: 'generated' | 'in_transit' | 'delivered' | 'cancelled'
  generatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const awbSchema = new Schema<IAWB>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    orderOrderId: {
      type: String,
      index: true,
      sparse: true,
    },
    awbCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courierName: {
      type: String,
      required: true,
    },
    courierId: Number,
    trackingUrl: String,
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    status: {
      type: String,
      enum: ['generated', 'in_transit', 'delivered', 'cancelled'],
      default: 'generated',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Create indexes
awbSchema.index({ orderId: 1 })
awbSchema.index({ orderOrderId: 1 })
awbSchema.index({ awbCode: 1 }, { unique: true })
awbSchema.index({ status: 1 })

export default mongoose.models.AWB || mongoose.model<IAWB>('AWB', awbSchema)
