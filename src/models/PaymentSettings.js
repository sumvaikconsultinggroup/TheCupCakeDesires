import mongoose from 'mongoose';

const razorpaySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  keyId: { type: String, default: '' },
  keySecret: { type: String, default: '' },
  webhookSecret: { type: String, default: '' },
  testMode: { type: Boolean, default: true },
  autoCapture: { type: Boolean, default: true },
  supportedMethods: {
    type: [String],
    default: ['card', 'upi', 'netbanking', 'wallet'],
  },
}, { _id: false });

const payuSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  merchantKey: { type: String, default: '' },
  merchantSalt: { type: String, default: '' },
  testMode: { type: Boolean, default: true },
  supportedMethods: {
    type: [String],
    default: ['card', 'upi', 'netbanking', 'wallet'],
  },
}, { _id: false });

const codSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  maxAmount: { type: Number, default: 50000 },
  minAmount: { type: Number, default: 0 },
  extraCharge: { type: Number, default: 0 },
  extraChargeType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  excludedPincodes: { type: [String], default: [] },
}, { _id: false });

const paymentSettingsSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    razorpay: {
      type: razorpaySchema,
      default: () => ({}),
    },
    payu: {
      type: payuSchema,
      default: () => ({}),
    },
    cod: {
      type: codSchema,
      default: () => ({}),
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['razorpay', 'payu', 'cod'],
      default: 'cod',
    },
  },
  { timestamps: true }
);

// Create index on storeId
paymentSettingsSchema.index({ storeId: 1 });

export default mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', paymentSettingsSchema);
