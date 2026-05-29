import mongoose from 'mongoose';

const orderPaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    orderSnapshot: {
      type: mongoose.Schema.Types.Mixed,
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.OrderPayment || mongoose.model('OrderPayment', orderPaymentSchema);