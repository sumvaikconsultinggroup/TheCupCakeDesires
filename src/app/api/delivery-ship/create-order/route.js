// src/app/api/delivery-ship/create-order/route.js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';
import axios from 'axios';


export async function POST(request) {
  try {
    const orderData = await request.json();

    if (!orderData.customer || !orderData.customer.address) {
      return NextResponse.json(
        { success: false, message: 'Incomplete customer address data. Cannot create Shiprocket order.' },
        { status: 400 }
      );
    }

    const shiprocketToken = await getShiprocketToken();

    const nameParts = orderData.customer.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // NOTE: This is a sample payload. You need to adapt it to your order data structure.
    const payload = {
      order_id: orderData.order_id, // Your internal order ID
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: 'Primary', // As configured in your Shiprocket account
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: orderData.customer.address,
      billing_city: orderData.customer.city,
      billing_pincode: orderData.customer.pincode,
      billing_state: orderData.customer.state,
      billing_country: 'Australia',
      billing_email: orderData.customer.email,
      billing_phone: orderData.customer.phone,
      shipping_is_billing: true,
      order_items: orderData.products.map((product) => ({
        name: product.name,
        sku: product.sku,
        units: product.quantity,
        selling_price: product.price,
        hsn: product.hsn_code || '',
      })),
      payment_method: orderData.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: orderData.sub_total,
      length: 10, 
      breadth: 10,
      height: 10,
      weight: 0.5, 
    };

    const url = `${process.env.SHIPROCKET_API_URL}/orders/create/adhoc`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating Shiprocket order:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to create Shiprocket order' },
      { status: 500 }
    );
  }
}
