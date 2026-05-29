import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
    await connectDb();
    const formData = await req.formData();
    const txnid = formData.get('txnid');

    const url = req.nextUrl.clone()
    url.pathname = '/failure'
    url.search = ''

    if (!txnid) {
        return NextResponse.redirect(url, 303);
    }

    try {
        const order = await Order.findById(txnid);

        if (!order) {
            return NextResponse.redirect(url, 303);
        }

        
        if (order.paymentDetails?.paymentStatus === 'paid') {
            console.warn(`Inconsistent state: Failure endpoint called for an already paid order. Order ID: ${order._id}, TXN ID: ${txnid}`);
            const successUrl = req.nextUrl.clone()
            successUrl.pathname = '/success'
            successUrl.search = ''
            return NextResponse.redirect(successUrl, 303);
        }

        // Update payment and order status to reflect failure
        if (!order.paymentDetails) {
            order.paymentDetails = {};
        }
        order.paymentDetails.paymentStatus = 'failed';
        order.status = 'cancelled';

        await order.save();

        // Use absolute URL for redirect to avoid 405 errors on Vercel
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
        const redirectUrl = `${baseUrl}/payment-failure`;
        
        return NextResponse.redirect(redirectUrl, 303);
    

    } catch (error) {
        console.error('Failure handling error:', error);
        return NextResponse.redirect(url, 303);
    }
}

