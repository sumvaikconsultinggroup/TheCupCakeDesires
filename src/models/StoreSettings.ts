import { Document, Schema, model, models } from 'mongoose'

export interface IStoreSettings extends Document {
  storeId: string
  
  // Store Basic Info
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  
  // Regional Settings
  currency: string
  timezone: string
  
  // Store Logo
  logoUrl?: string
  
  createdAt: Date
  updatedAt: Date
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true, default: 'default' },
    
    // Store Basic Info
    storeName: { type: String, default: 'CupCake Desires' },
    storeEmail: { type: String, default: 'hello@cupcakedesires.com' },
    storePhone: { type: String, default: '03 9876 5432' },
    storeAddress: { type: String, default: '352 Princes Hwy, Narre Warren, VIC 3805, Australia' },

    // Regional Settings
    currency: { type: String, default: 'AUD' },
    timezone: { type: String, default: 'Australia/Melbourne' },

    // Store Logo
    logoUrl: { type: String, default: '/images/Cupcake-Logo.png' },
  },
  { timestamps: true, versionKey: false }
)

const StoreSettings = models?.StoreSettings || model<IStoreSettings>('StoreSettings', StoreSettingsSchema)

export default StoreSettings
