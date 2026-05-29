import { NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import PayUPaymentResponse from '@/models/PayUPaymentResponse';
import Order from '@/models/Order';

export async function POST(req) {
  try {
    await connectDb();

    const formData = await req.formData();
    const data = Object.fromEntries(formData);

    const { txnid, orderId, clerkId } = data;

    // Validate required fields
    if (!txnid || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: txnid and orderId' },
        { status: 400 }
      );
    }

    // Find order to get clerkId if not provided
    let finalClerkId = clerkId;
    if (!finalClerkId) {
      const order = await Order.findOne({
        $or: [
          { orderId: orderId },
          { _id: orderId }
        ]
      }).lean();

      if (order && order.userId) {
        finalClerkId = order.userId;
      }
    }

    if (!finalClerkId) {
      return NextResponse.json(
        { success: false, message: 'Could not determine clerkId' },
        { status: 400 }
      );
    }

    // Check if payment response already exists
    const existingPayment = await PayUPaymentResponse.findOne({ txnid });

    const paymentData = {
      clerkId: finalClerkId,
      orderId: orderId,
      mihpayid: data.mihpayid || '',
      mode: data.mode || '',
      status: data.status || '',
      unmappedstatus: data.unmappedstatus || '',
      key: data.key || '',
      txnid: data.txnid || '',
      amount: data.amount || '',
      cardCategory: data.cardCategory || '',
      discount: data.discount || '',
      net_amount_debit: data.net_amount_debit || '',
      addedon: data.addedon || '',
      productinfo: data.productinfo || '',
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      address1: data.address1 || '',
      address2: data.address2 || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      zipcode: data.zipcode || '',
      email: data.email || '',
      phone: data.phone || '',
      hash: data.hash || '',
      field1: data.field1 || '',
      field2: data.field2 || '',
      field3: data.field3 || '',
      field4: data.field4 || '',
      field5: data.field5 || '',
      field6: data.field6 || '',
      field7: data.field7 || '',
      field8: data.field8 || '',
      field9: data.field9 || '',
      payment_source: data.payment_source || '',
      PG_TYPE: data.PG_TYPE || '',
      bank_ref_num: data.bank_ref_num || '',
      bankcode: data.bankcode || '',
      error: data.error || '',
      error_Message: data.error_Message || '',
      cardnum: data.cardnum || '',
      udf1: data.udf1 || '',
      udf2: data.udf2 || '',
      udf3: data.udf3 || '',
      udf4: data.udf4 || '',
      udf5: data.udf5 || '',
      udf6: data.udf6 || '',
      udf7: data.udf7 || '',
      udf8: data.udf8 || '',
      udf9: data.udf9 || '',
      udf10: data.udf10 || '',
      rawResponse: data, // Store full response
    };

    let paymentResponse;
    if (existingPayment) {
      // Update existing payment
      paymentResponse = await PayUPaymentResponse.findOneAndUpdate(
        { txnid },
        { $set: paymentData },
        { new: true }
      );
    } else {
      // Create new payment response
      paymentResponse = await PayUPaymentResponse.create(paymentData);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment response stored successfully',
      paymentResponse: {
        id: paymentResponse._id.toString(),
        txnid: paymentResponse.txnid,
        orderId: paymentResponse.orderId,
        clerkId: paymentResponse.clerkId,
        status: paymentResponse.status,
        amount: paymentResponse.amount,
      },
    });
  } catch (error) {
    console.error('Error storing PayU payment response:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to store payment response', error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch payment responses
export async function GET(req) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');
    const orderId = searchParams.get('orderId');
    const txnid = searchParams.get('txnid');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query = {};
    if (clerkId) query.clerkId = clerkId;
    if (orderId) query.orderId = orderId;
    if (txnid) query.txnid = txnid;

    const [payments, total] = await Promise.all([
      PayUPaymentResponse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PayUPaymentResponse.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      payments: payments.map((payment) => ({
        ...payment,
        _id: payment._id.toString(),
        id: payment._id.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching PayU payment responses:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment responses', error: error.message },
      { status: 500 }
    );
  }
}
