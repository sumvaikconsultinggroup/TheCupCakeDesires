import mongoose, { Document, Schema } from 'mongoose'

const VariantSchema = new Schema(
  {
    option1Value: String,
    option2Value: String,
    option3Value: String,
    sku: String,
    inventoryQty: Number,
    inventoryPolicy: String,
    price: Number,
    compareAtPrice: Number,
    requiresShipping: Boolean,
    taxable: Boolean,
    barcode: String,
    image: String,
    weightUnit: String,
    _id: String,
  },
  { _id: false }
)

export interface ICartProduct {
  id?: string
  productId: string
  name: string
  price: number
  quantity: number
  minOrderQty?: number
  imageUrl?: string
  handle?: string
  variant?: typeof VariantSchema
  variants?: {
    name: string
    option: string
  }[]
}

export interface ICartNotification extends Document {
  userId: string
  email: string
  userName: string
  phoneNumber: string
  isSent: boolean
  isActive: boolean
  products: ICartProduct[]
  createdAt: Date
  updatedAt: Date
  subtotal: number
}

const CartProductSchema = new Schema(
  {
    productId: { type: String, required: true },
    id: String,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    minOrderQty: { type: Number, min: 1 },
    imageUrl: String,
    handle: String,
    variant: VariantSchema,
    variants: [
      {
        name: String,
        option: String,
      },
    ],
  },
  { _id: false }
)

const CartNotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    userName: String,
    phoneNumber: String,
    isSent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    subtotal: { type: Number, default: 0 },
    products: [CartProductSchema],
  },
  { timestamps: true, versionKey: false }
)

export default mongoose.models.CartNotification ||
  mongoose.model<ICartNotification>('CartNotification', CartNotificationSchema)
