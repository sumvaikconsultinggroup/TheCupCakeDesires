import mongoose, { Document, Schema } from 'mongoose'
import { IVariant } from './product.model'

export interface IWishlistItem {
  productId?: string
  comboId?: string
  productName: string
  itemType: 'product' | 'combo'
  variant?: IVariant
}

export interface IReview {
  status: 'submitted' | 'pending'
  review: string
}

export interface IAddress {
  billing_address_type: 'home' | 'office' | 'other'
  billing_customer_name: string
  billing_last_name: string
  billing_addressLine: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
}

export interface IOrderItem {
  orderId: string
  name: string
  quantity: number
  price: number
  productId: string
  productName: string
  review: IReview
}

export interface IWalletTransaction {
  type: 'credit' | 'debit'
  points: number
  description?: string
  referenceId?: Schema.Types.ObjectId
  balanceAfter: number
  createdAt: Date
  updatedAt: Date
}

export interface IWallet {
  points: number
  transactions: IWalletTransaction[]
  createdAt: Date
  updatedAt: Date
}

export interface IUser extends Document {
  clerkId: string
  billing_fullname: string
  email: string
  billing_phone: string
  billing_customer_dob: Date
  billing_customer_gender: 'male' | 'female' | 'other'
  billing_address: IAddress[]
  wishlist: IWishlistItem[]
  orders: IOrderItem[]
  wallet: IWallet
  createdAt: Date
  updatedAt: Date
}

const WishlistItemSchema: Schema = new Schema({
  productId: { type: String, required: false },
  comboId: { type: String, required: false },
  productName: { type: String, required: false },
  itemType: { type: String, enum: ['product', 'combo'], default: 'product' },
  variant: { type: Object },
})

const ReviewSchema: Schema = new Schema({
  status: { type: String, enum: ['submitted', 'pending'], required: false },
  review: { type: String, required: false },
})

const OrderItemSchema: Schema = new Schema({
  orderId: { type: String, required: false },
  name: { type: String, required: false },
  quantity: { type: Number, required: false },
  price: { type: Number, required: false },
  productId: { type: String, required: false },
  productName: { type: String, required: false },
  review: ReviewSchema,
})

const WalletTransactionSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

const WalletSchema = new Schema(
  {
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [WalletTransactionSchema],
  },
  { timestamps: true }
)

const AddressSchema = new Schema(
  {
    billing_address_type: {
      type: String,
      enum: ['home', 'office', 'other'],
      required: false,
    },
    billing_customer_name: { type: String, required: false, trim: true },
    billing_last_name: { type: String, required: false, trim: true },
    billing_addressLine: { type: String, required: false, trim: true },
    billing_city: { type: String, required: false, trim: true },
    billing_pincode: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^\d{6}$/.test(v)
        },
        message: 'Pincode must be exactly 6 digits'
      }
    },
    billing_state: { type: String, required: false, trim: true },
    billing_country: { type: String, required: false, trim: true },
  }
)

const UserSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    billing_fullname: { type: String, required: false },
    email: { type: String, required: false },
    billing_phone: { type: String, required: false },
    billing_customer_dob: { type: Date, required: false },
    billing_customer_gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false,
    },
    billing_address: [AddressSchema],
    wishlist: [WishlistItemSchema],
    orders: [OrderItemSchema],
    wallet: {
      type: WalletSchema,
      default: () => ({ points: 0, transactions: [] }),
    },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
