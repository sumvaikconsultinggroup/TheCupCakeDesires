import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Order from '@/models/Order';
import crypto from 'crypto-js';

export async function GET() {
  try {
    await connectDb();
    const payments = await Payment.find().populate('orderId', 'id');
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDb();

    const { orderId, amount, currency, provider } = await req.json();

    if (!orderId || !amount || !currency || !provider) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // PayU.in integration
    const PAYU_KEY = process.env.PAYU_KEY;
    const PAYU_SALT = process.env.PAYU_SALT;

    if (!PAYU_KEY || !PAYU_SALT) {
      return NextResponse.json({ message: 'PayU credentials not configured' }, { status: 500 });
    }

    const txnid = `txn_${orderId}_${Date.now()}`;
    const productinfo = 'Order Payment';
    const firstname = order.user.firstName + ' ' + order.user.lastName;
    const email = order.user.email;

    // Generate hash for PayU
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
    const hash = crypto.SHA512(hashString).toString();

    const newPayment = new Payment({
      orderId,
      amount,
      currency,
      provider,
      transactionId: txnid,
      status: 'created',
      paymentDetails: {
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        hash,
        gatewayUrl: process.env.NEXT_PUBLIC_PAYU_URL || 'https://secure.payu.in/_payment',
      },
    });

    await newPayment.save();

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
