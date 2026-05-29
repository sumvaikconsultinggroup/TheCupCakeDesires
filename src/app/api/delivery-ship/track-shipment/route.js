// src/app/api/delivery-ship/track-shipment/route.js
import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';
import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awbCode = searchParams.get('awb_code');

    if (!awbCode) {
      return NextResponse.json({ success: false, message: 'AWB code is required' }, { status: 400 });
    }

    const shiprocketToken = await getShiprocketToken();

    const url = `${process.env.SHIPROCKET_API_URL}/tracking/${awbCode}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shiprocketToken}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error tracking Shiprocket shipment:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to track Shiprocket shipment' },
      { status: 500 }
    );
  }
}
