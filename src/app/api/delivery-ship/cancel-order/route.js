// src/app/api/delivery-ship/cancel-order/route.js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';
import axios from 'axios';
import Order from '@/models/Order';
import connectDb from '@/lib/mongodb'


export async function POST(request) {
  try {
    await connectDb();
    const { internal_order_id } = await request.json();

    if (!internal_order_id) {
      return NextResponse.json({ success: false, message: 'Internal Order ID is required' }, { status: 400 });
    }

    const order = await Order.findById(internal_order_id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (!order.shippingDetails || !order.shippingDetails.shiprocket_order_id) {
      // If order is not yet in shiprocket, just cancel it locally
      order.orderStatus = 'cancelled';
      await order.save();
      // Optionally trigger refund here
      return NextResponse.json({ success: true, message: 'Order cancelled locally as it was not shipped.' });
    }

    const shiprocketToken = await getShiprocketToken();

    const url = `${process.env.SHIPROCKET_API_URL}/orders/cancel`;
    const payload = {
      ids: [order.shippingDetails.shiprocket_order_id],
    };

    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });

    // Update the order in your database
    await Order.findByIdAndUpdate(internal_order_id, {
      orderStatus: 'cancelled',
      $push: {
        statusLogs: {
          status: 'cancelled',
          timestamp: new Date(),
          message: 'Shipment cancelled by user.',
        },
      },
    });

    // Here you should trigger the refund process.
    // For now, we will just return a success message.
    // You could call the /api/delivery-ship/process-refund endpoint from here.
    
    return NextResponse.json({ success: true, message: 'Shipment cancellation requested successfully.' });
  } catch (error) {
    console.error('Error cancelling Shiprocket order:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel Shiprocket order' },
      { status: 500 }
    );
  }
}

