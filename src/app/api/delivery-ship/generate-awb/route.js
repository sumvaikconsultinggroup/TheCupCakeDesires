// src/app/api/delivery-ship/generate-awb/route.js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';
import axios from 'axios';
import Order from '@/models/Order';
import connectDb from '@/lib/mongodb'

export async function POST(request) {
  try {
    await connectDb();
    const { shiprocket_order_id, shiprocket_shipment_id, internal_order_id } = await request.json();

    if (!shiprocket_shipment_id || !internal_order_id) {
      return NextResponse.json({ success: false, message: 'Shipment ID and Internal Order ID are required' }, { status: 400 });
    }

    const shiprocketToken = await getShiprocketToken();

    // First, you might need to request courier availability
    const courierResponse = await axios.get(`${process.env.SHIPROCKET_API_URL}/courier/serviceability`, {
        headers: { Authorization: `Bearer ${shiprocketToken}` },
        params: {
            shipment_id: shiprocket_shipment_id,
            pickup_postcode: '110001', // Your pickup pincode
            delivery_postcode: '110002', // Customer's pincode from order
            cod: 1, // 1 for COD, 0 for Prepaid
            weight: 0.5, // kg
            declared_value: 1000
        }
    });

    if(courierResponse.data.status !== 200 || courierResponse.data.data.available_courier_companies.length === 0){
        return NextResponse.json({ success: false, message: 'No couriers available for this shipment' }, { status: 400 });
    }
    
    // For simplicity, picking the first available courier. 
    // In a real app, you might have logic to choose the best/cheapest one.
    const courier_id = courierResponse.data.data.available_courier_companies[0].courier_company_id;

    const url = `${process.env.SHIPROCKET_API_URL}/courier/assign/awb`;
    const payload = {
      shipment_id: shiprocket_shipment_id,
      courier_id: courier_id,
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });

    const { awb_code, courier_name, tracking_url } = response.data.data;

    // Update the order in your database
    await Order.findByIdAndUpdate(internal_order_id, {
      'shippingDetails.awb_code': awb_code,
      'shippingDetails.courier_name': courier_name,
      'shippingDetails.tracking_url': tracking_url,
      'shippingDetails.shiprocket_order_id': shiprocket_order_id,
      'shippingDetails.shiprocket_shipment_id': shiprocket_shipment_id,
      orderStatus: 'shipped',
      $push: {
        statusLogs: {
          status: 'shipped',
          timestamp: new Date(),
          message: `Shipped with ${courier_name}. AWB: ${awb_code}`,
        },
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error generating Shiprocket AWB:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to generate Shiprocket AWB' },
      { status: 500 }
    );
  }
}

