import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Payment from '@/models/Payment';
import OrderPayment from '@/models/OrderPayment';
import Order from '@/models/Order';

export async function POST(req) {
  try {
    await connectDb();

    // In a real application, you would verify the webhook signature here
    // to ensure the request is coming from the payment provider.

    const { transactionId, status, paymentDetails } = await req.json();

    if (!transactionId || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    payment.status = status;
    payment.paymentDetails = paymentDetails;
    await payment.save();

    const order = await Order.findById(payment.orderId);

    if (order) {
      let orderPayment = await OrderPayment.findOne({ order: order._id });

      if (orderPayment) {
        orderPayment.paymentStatus = status;
        await orderPayment.save();
      } else {
        orderPayment = new OrderPayment({
          order: order._id,
          payment: payment._id,
          orderSnapshot: order.toObject(),
          paymentStatus: status,
        });
        await orderPayment.save();
      }

      // Update the order status as well
      if (status === 'paid') {
        order.payment.status = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();
      } else if (status === 'failed') {
        order.payment.status = 'failed';
        await order.save();
      }
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
