import mongoose from 'mongoose';

const payUPaymentResponseSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    // PayU Response Fields
    mihpayid: String,
    mode: String,
    status: String,
    unmappedstatus: String,
    key: String,
    txnid: String,
    amount: String,
    cardCategory: String,
    discount: String,
    net_amount_debit: String,
    addedon: String,
    productinfo: String,
    firstname: String,
    lastname: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
    email: String,
    phone: String,
    hash: String,
    field1: String,
    field2: String,
    field3: String,
    field4: String,
    field5: String,
    field6: String,
    field7: String,
    field8: String,
    field9: String,
    payment_source: String,
    PG_TYPE: String,
    bank_ref_num: String,
    bankcode: String,
    error: String,
    error_Message: String,
    cardnum: String,
    // UDF fields
    udf1: String,
    udf2: String,
    udf3: String,
    udf4: String,
    udf5: String,
    udf6: String,
    udf7: String,
    udf8: String,
    udf9: String,
    udf10: String,
    // Store full response as backup
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
payUPaymentResponseSchema.index({ clerkId: 1, createdAt: -1 });
payUPaymentResponseSchema.index({ orderId: 1 });
payUPaymentResponseSchema.index({ txnid: 1 });
payUPaymentResponseSchema.index({ status: 1 });

export default mongoose.models.PayUPaymentResponse || mongoose.model('PayUPaymentResponse', payUPaymentResponseSchema);
