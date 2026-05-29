// src/app/api/delivery-ship/create-return-order/route.js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';
import axios from 'axios';
import Order from '@/models/Order';
import connectDb from '@/lib/mongodb'

export async function POST(request) {
  try {
    await connectDb();
    const { internal_order_id, reason, products_to_return } = await request.json();

    if (!internal_order_id || !reason || !products_to_return) {
      return NextResponse.json({ success: false, message: 'Internal Order ID, reason, and products are required' }, { status: 400 });
    }

    const order = await Order.findById(internal_order_id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const shiprocketToken = await getShiprocketToken();
    
    // This payload is an example and needs to be adjusted based on Shiprocket's API for return orders
    const payload = {
      order_id: `RTN-${order._id.toString()}`, // A unique ID for the return order
      order_date: new Date().toISOString().slice(0, 10),
      channel_id: '', // Your channel ID from Shiprocket
      pickup_customer_name: order.deliveryAddress.firstName + ' ' + order.deliveryAddress.lastName,
      pickup_address: order.deliveryAddress.address1,
      pickup_city: order.deliveryAddress.city,
      pickup_pincode: order.deliveryAddress.zip,
      pickup_state: order.deliveryAddress.province,
      pickup_country: 'Australia',
      pickup_email: order.user.email,
      pickup_phone: order.deliveryAddress.phone,
      shipping_customer_name: "CupCake Desires Warehouse",
      shipping_address: "352 Princes Hwy, Narre Warren",
      shipping_city: "Narre Warren",
      shipping_pincode: "3805",
      shipping_country: "Australia",
      shipping_state: "Victoria",
      order_items: products_to_return.map(p => ({
        name: p.name,
        sku: p.sku,
        units: p.quantity,
        selling_price: p.price,
      })),
      payment_method: 'Prepaid', // Returns are typically pre-paid in terms of shipping cost
      sub_total: products_to_return.reduce((acc, p) => acc + (p.price * p.quantity), 0),
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const url = `${process.env.SHIPROCKET_API_URL}/orders/create/return`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });

    const { order_id: return_order_id, shipment_id, awb_code, courier_name } = response.data;
    const tracking_url = `https://shiprocket.co/tracking/${awb_code}`;


    // Update the order in your database
    await Order.findByIdAndUpdate(internal_order_id, {
      'returnDetails.status': 'initiated',
      'returnDetails.reason': reason,
      'returnDetails.shiprocket_return_order_id': return_order_id,
      'returnDetails.shiprocket_return_awb': awb_code,
      'returnDetails.return_tracking_url': tracking_url,
      orderStatus: 'return_initiated',
      $push: {
        statusLogs: {
          status: 'return_initiated',
          timestamp: new Date(),
          message: `Return initiated with ${courier_name}. AWB: ${awb_code}`,
        },
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating Shiprocket return order:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to create Shiprocket return order' },
      { status: 500 }
    );
  }
}

