import { Document, Schema, model, models } from 'mongoose'

export type ShipmentProvider = 'shiprocket' | 'delhivery' | 'bluedart' | 'manual'
export type ShipmentStatus = 
  | 'pending'
  | 'processing'
  | 'ready_to_ship'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled'

export interface IShipment extends Document {
  shipmentId: string // Unique shipment ID
  orderId: string // Reference to Order
  provider: ShipmentProvider
  
  // Provider-specific IDs
  providerShipmentId?: string // Shiprocket shipment_id
  providerOrderId?: string // Shiprocket order_id
  awbNumber?: string // Air Waybill number
  courierName?: string
  courierId?: number
  
  // Package details
  package: {
    weight: number // in kg
    length: number // in cm
    width: number // in cm
    height: number // in cm
    volumetricWeight?: number
  }
  
  // Pickup address
  pickupAddress: {
    name: string
    phone: string
    email?: string
    address: string
    address2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  
  // Delivery address
  deliveryAddress: {
    name: string
    phone: string
    email?: string
    address: string
    address2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  
  // Status
  status: ShipmentStatus
  statusHistory: {
    status: ShipmentStatus
    location?: string
    timestamp: Date
    description?: string
    providerStatus?: string
  }[]
  
  // Shipping details
  shippingMethod: 'standard' | 'express' | 'overnight' | 'same_day' | 'cod'
  shippingCost: number
  estimatedDeliveryDate?: Date
  actualDeliveryDate?: Date
  
  // COD details
  isCod: boolean
  codAmount?: number
  codCollected?: boolean
  codRemittedAt?: Date
  
  // Label & Invoice
  labelUrl?: string
  labelGeneratedAt?: Date
  invoiceUrl?: string
  manifestId?: string
  
  // Tracking
  trackingUrl?: string
  lastTrackedAt?: Date
  trackingHistory: {
    timestamp: Date
    location?: string
    status: string
    description?: string
    scannedLocation?: string
  }[]
  
  // Items in shipment
  items: {
    productId: string
    productName: string
    sku?: string
    quantity: number
    price: number
    weight?: number
  }[]
  
  // Return/RTO handling
  isReturn: boolean
  returnReason?: string
  rtoInitiatedAt?: Date
  rtoDeliveredAt?: Date
  
  // Insurance
  isInsured: boolean
  insuranceAmount?: number
  insuranceProvider?: string
  
  // Delivery attempts
  deliveryAttempts: {
    attemptNumber: number
    timestamp: Date
    status: 'attempted' | 'delivered' | 'failed'
    reason?: string
    rescheduleDate?: Date
  }[]
  
  // Notes and metadata
  notes?: string
  metadata?: Record<string, any>
  
  // Timestamps
  pickedUpAt?: Date
  inTransitAt?: Date
  outForDeliveryAt?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PackageSchema = new Schema({
  weight: { type: Number, required: true },
  length: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  volumetricWeight: Number,
}, { _id: false })

const AddressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: { type: String, required: true },
  address2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^\d{6}$/.test(v)
      },
      message: 'Pincode must be exactly 6 digits'
    }
  },
  country: { type: String, default: 'India' },
}, { _id: false })

const StatusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready_to_ship', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
  },
  location: String,
  timestamp: { type: Date, default: Date.now },
  description: String,
  providerStatus: String,
}, { _id: false })

const TrackingHistorySchema = new Schema({
  timestamp: { type: Date, required: true },
  location: String,
  status: { type: String, required: true },
  description: String,
  scannedLocation: String,
}, { _id: false })

const ShipmentItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: String,
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  weight: Number,
}, { _id: false })

const DeliveryAttemptSchema = new Schema({
  attemptNumber: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  status: {
    type: String,
    enum: ['attempted', 'delivered', 'failed'],
  },
  reason: String,
  rescheduleDate: Date,
}, { _id: false })

const ShipmentSchema = new Schema<IShipment>(
  {
    shipmentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['shiprocket', 'delhivery', 'bluedart', 'manual'],
      default: 'manual',
    },
    
    // Provider-specific IDs
    providerShipmentId: { type: String, index: true, sparse: true },
    providerOrderId: String,
    awbNumber: { type: String, index: true, sparse: true },
    courierName: String,
    courierId: Number,
    
    // Package details
    package: { type: PackageSchema, required: true },
    
    // Addresses
    pickupAddress: { type: AddressSchema, required: true },
    deliveryAddress: { type: AddressSchema, required: true },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready_to_ship', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [StatusHistorySchema],
    
    // Shipping details
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'same_day', 'cod'],
      default: 'standard',
    },
    shippingCost: { type: Number, default: 0 },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    
    // COD
    isCod: { type: Boolean, default: false },
    codAmount: Number,
    codCollected: { type: Boolean, default: false },
    codRemittedAt: Date,
    
    // Label & Invoice
    labelUrl: String,
    labelGeneratedAt: Date,
    invoiceUrl: String,
    manifestId: String,
    
    // Tracking
    trackingUrl: String,
    lastTrackedAt: Date,
    trackingHistory: [TrackingHistorySchema],
    
    // Items
    items: [ShipmentItemSchema],
    
    // Return/RTO
    isReturn: { type: Boolean, default: false },
    returnReason: String,
    rtoInitiatedAt: Date,
    rtoDeliveredAt: Date,
    
    // Insurance
    isInsured: { type: Boolean, default: false },
    insuranceAmount: Number,
    insuranceProvider: String,
    
    // Delivery attempts
    deliveryAttempts: [DeliveryAttemptSchema],
    
    // Notes and metadata
    notes: String,
    metadata: Schema.Types.Mixed,
    
    // Timestamps
    pickedUpAt: Date,
    inTransitAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true, versionKey: false }
)

// Indexes
ShipmentSchema.index({ status: 1 })
ShipmentSchema.index({ provider: 1 })
ShipmentSchema.index({ 'deliveryAddress.pincode': 1 })
ShipmentSchema.index({ createdAt: -1 })
ShipmentSchema.index({ estimatedDeliveryDate: 1 })

const Shipment = models?.Shipment || model<IShipment>('Shipment', ShipmentSchema)

export default Shipment
