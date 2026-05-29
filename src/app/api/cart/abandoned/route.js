import mailer from '@/lib/mailer'
import CartNotification from '@/models/CartNotification'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const carts = await CartNotification.find({
      isSent: false,
      isActive: true,
    })

    for (const cart of carts) {
      await mailer({
        email: cart.email,
        subject: 'You left items in your cart',
        html: `
<div style="max-width:640px;margin:auto;font-family:Arial,Helvetica,sans-serif;background:#f5f7ff;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(27,25,143,.25)">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1b198f,#4f46e5);padding:35px;text-align:center;color:white">
    <h1 style="margin:0;font-size:32px;letter-spacing:1px">Your Cart Is Waiting</h1>
    <p style="margin:12px 0 0;font-size:16px;opacity:.9">
      Complete your purchase before your items sell out
    </p>
  </div>

  <!-- BODY -->
  <div style="padding:30px;color:#1f2933">

    <h2 style="margin-top:0;font-weight:600">
      Hello ${cart.userName || 'Valued Customer'},
    </h2>

    <p style="font-size:15px;line-height:1.7">
      You were just one step away from completing your order.  
      These premium products are still reserved in your cart — but availability is limited.
    </p>

    <!-- CART ITEMS -->
    <div style="margin:25px 0">
      ${cart.products
        .map(
          (p) => `
        <div style="display:flex;align-items:center;background:white;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,.06)">
          <img src="${p.imageUrl || ''}" style="width:70px;height:70px;border-radius:10px;object-fit:cover;margin-right:14px"/>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:600">${p.name}</div>
            <div style="font-size:13px;color:#6b7280">${p.variant?.option1Value || ''}</div>
            <div style="font-size:13px;color:#6b7280">Qty: ${p.quantity}</div>
          </div>
          <div style="font-weight:600">$${p.price}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:35px 0">
      <a href="${process.env.STORE_URL}/cart"
        style="background:linear-gradient(135deg,#1b198f,#4f46e5);
        color:white;text-decoration:none;padding:16px 40px;border-radius:40px;
        font-size:16px;font-weight:600;display:inline-block">
        Complete My Order →
      </a>
    </div>

    <!-- TRUST -->
    <div style="display:flex;justify-content:space-between;margin-top:25px;text-align:center;font-size:13px;color:#6b7280">
      <div>✔ Secure Checkout</div>
      <div>🚚 Fast Delivery</div>
      <div>🔒 100% Authentic</div>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="background:#0f172a;color:#c7d2fe;padding:18px;text-align:center;font-size:12px">
    You are receiving this email because you added products to your cart at ${process.env.STORE_NAME}.
    <br/>Need help? Contact support anytime.
  </div>
</div>
`,
      })

      await CartNotification.updateOne({ _id: cart._id }, { $set: { isSent: true, isActive: false } })
    }

    return NextResponse.json({ success: true, sent: carts.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
