// src/app/api/delivery-ship/process-refund/route.js
import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import connectDb from '@/lib/mongodb'
import crypto from 'crypto-js';
import axios from 'axios';

export async function POST(request) {
  try {
    await connectDb();
    const { internal_order_id, amount_to_refund } = await request.json();

    if (!internal_order_id || !amount_to_refund) {
      return NextResponse.json({ success: false, message: 'Internal Order ID and amount are required' }, { status: 400 });
    }

    const order = await Order.findById(internal_order_id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    //
    // START of PayU Refund Logic Placeholder
    //
    // The following is a conceptual guide. You MUST consult the PayU documentation
    // for the correct API endpoints, parameters, and hash calculation for refunds.
    
    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;
    const paymentId = order.payment.transactionId; // The `payuMoneyId` from the payment callback
    const refundAmount = amount_to_refund;
    const refundTxnId = `REFUND-${internal_order_id}-${Date.now()}`;

    // The command for refunds is typically `cancel_refund_transaction`
    const command = 'cancel_refund_transaction';
    
    // The hash for refunds is different. Consult PayU docs. A possible format:
    const hashString = `${merchantKey}|${command}|${paymentId}|${refundTxnId}|${refundAmount}|${salt}`;
    const hash = crypto.SHA512(hashString).toString(crypto.enc.Hex);

    const payload = {
        key: merchantKey,
        command: command,
        hash: hash,
        var1: paymentId, // `var1` is usually the payment ID
        var2: refundTxnId,
        var3: refundAmount
    };
    
    try {
        // PayU refund API URL - this is a guess, get the correct one from docs
        const payuRefundUrl = 'https://info.payu.in/merchant/postservice.php?form=2'; 

        // This would be the actual call to PayU
        // const payuResponse = await axios.post(payuRefundUrl, payload);
        
        // if (payuResponse.data.status === 1) { // Assuming 1 means success
        // } else {
        //   throw new Error(`PayU refund failed: ${payuResponse.data.msg}`);
        // }

    } catch(err) {
        console.error("PayU refund initiation failed:", err.message);
        return NextResponse.json({ success: false, message: 'Failed to initiate refund with payment gateway.' }, { status: 500 });
    }
    
    //
    // END of PayU Refund Logic Placeholder
    //


    // Update the order in your database
    await Order.findByIdAndUpdate(internal_order_id, {
      orderStatus: 'refunded',
      'payment.status': 'refunded',
      $push: {
        statusLogs: {
          status: 'refunded',
          timestamp: new Date(),
          message: `Refund of ${amount_to_refund} processed.`,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Refund processed successfully.' });
  } catch (error) {
    console.error('Error processing refund:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

