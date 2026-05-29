import { Document, Schema, model, models } from 'mongoose'

export interface IRazorpaySettings {
  enabled: boolean
  keyId: string
  keySecret: string
  webhookSecret: string
  testMode: boolean
  autoCapture: boolean
  supportedMethods: ('card' | 'upi' | 'netbanking' | 'wallet' | 'emi')[]
}

export interface IPayUSettings {
  enabled: boolean
  merchantKey: string
  merchantSalt: string
  testMode: boolean
  supportedMethods: ('card' | 'upi' | 'netbanking' | 'wallet' | 'emi')[]
}

export interface IShiprocketSettings {
  enabled: boolean
  email: string
  password: string
  channelId?: number
  pickupLocationId?: number
  defaultCourierId?: number
  autoManifest: boolean
  autoLabel: boolean
  testMode: boolean
}

export interface ICODSettings {
  enabled: boolean
  maxAmount: number
  minAmount: number
  extraCharge: number
  extraChargeType: 'fixed' | 'percentage'
  excludedPincodes: string[]
}

export interface IPaymentSettings extends Document {
  storeId: string
  
  // Payment Gateways
  razorpay: IRazorpaySettings
  payu: IPayUSettings
  
  // Shipping
  shiprocket: IShiprocketSettings
  
  // COD
  cod: ICODSettings
  
  // General settings
  defaultPaymentMethod: 'razorpay' | 'payu' | 'cod'
  defaultCurrency: string
  taxRate: number
  taxInclusive: boolean
  
  // Shipping settings
  freeShippingThreshold: number
  defaultShippingCost: number
  
  // Pickup address (for Shiprocket)
  pickupAddress: {
    name: string
    phone: string
    email: string
    address: string
    address2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  
  createdAt: Date
  updatedAt: Date
}

const RazorpaySettingsSchema = new Schema({
  enabled: { type: Boolean, default: false },
  keyId: { type: String, default: '' },
  keySecret: { type: String, default: '' },
  webhookSecret: { type: String, default: '' },
  testMode: { type: Boolean, default: true },
  autoCapture: { type: Boolean, default: true },
  supportedMethods: [{
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
  }],
}, { _id: false })

const PayUSettingsSchema = new Schema({
  enabled: { type: Boolean, default: false },
  merchantKey: { type: String, default: '' },
  merchantSalt: { type: String, default: '' },
  testMode: { type: Boolean, default: true },
  supportedMethods: [{
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
  }],
}, { _id: false })

const ShiprocketSettingsSchema = new Schema({
  enabled: { type: Boolean, default: false },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  channelId: Number,
  pickupLocationId: Number,
  defaultCourierId: Number,
  autoManifest: { type: Boolean, default: false },
  autoLabel: { type: Boolean, default: true },
  testMode: { type: Boolean, default: true },
}, { _id: false })

const CODSettingsSchema = new Schema({
  enabled: { type: Boolean, default: true },
  maxAmount: { type: Number, default: 50000 },
  minAmount: { type: Number, default: 0 },
  extraCharge: { type: Number, default: 0 },
  extraChargeType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  excludedPincodes: [String],
}, { _id: false })

const PickupAddressSchema = new Schema({
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  address2: String,
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  country: { type: String, default: 'India' },
}, { _id: false })

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    
    razorpay: { type: RazorpaySettingsSchema, default: () => ({}) },
    payu: { type: PayUSettingsSchema, default: () => ({}) },
    shiprocket: { type: ShiprocketSettingsSchema, default: () => ({}) },
    cod: { type: CODSettingsSchema, default: () => ({}) },
    
    defaultPaymentMethod: {
      type: String,
      enum: ['razorpay', 'payu', 'cod'],
      default: 'cod',
    },
    defaultCurrency: { type: String, default: 'AUD' },
    taxRate: { type: Number, default: 18 },
    taxInclusive: { type: Boolean, default: true },
    
    freeShippingThreshold: { type: Number, default: 999 },
    defaultShippingCost: { type: Number, default: 49 },
    
    pickupAddress: { type: PickupAddressSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
)

const PaymentSettings = models?.PaymentSettings || model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema)

export default PaymentSettings
