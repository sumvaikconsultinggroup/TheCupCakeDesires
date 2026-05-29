// src/app/api/after-payment/success/route.js
import { sendOperationsNewOrderEmail, sendOrderConfirmedEmail, sendPaymentFailedEmail } from '@/lib/email-service'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import PayUPaymentResponse from '@/models/PayUPaymentResponse'
import PromoCode from '@/models/PromoCode'
import User from '@/models/User'
import Product from '@/models/product.model'
import crypto from 'crypto-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    await connectDb()
    const formData = await req.formData()
    const data = Object.fromEntries(formData)

    const { txnid, status, hash } = data

    // Verify the payment hash
    const salt = process.env.PAYU_SALT
    const key = process.env.PAYU_MERCHANT_KEY

    // The hash string generation for response is different from request
    const hashString = `${salt}|${status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${txnid}|${key}`
    const calculatedHash = crypto.SHA512(hashString).toString(crypto.enc.Hex)

    if (calculatedHash !== hash) {
      // Hash doesn't match, this might be a fraudulent request
      console.error('Hash verification failed. Expected:', calculatedHash, 'Received:', hash)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
      return NextResponse.redirect(`${baseUrl}/payment-failure`, 303)
    }

    if (status === 'success') {
      // Find order to get orderId and userId for payment log
      const orderQuery = /^[0-9a-fA-F]{24}$/.test(txnid)
        ? { $or: [{ orderId: txnid }, { _id: txnid }] }
        : { orderId: txnid }

      const foundOrder = await Order.findOne(orderQuery).lean()

      if (!foundOrder) {
        console.error('Order not found for payment log. txnid:', txnid, 'query:', JSON.stringify(orderQuery))
      }

      // Store PayU payment response data — always attempt, even if order lookup fails
      try {
        const paymentData = {
          clerkId: foundOrder?.userId || '',
          orderId: foundOrder?.orderId || txnid,
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
          rawResponse: data,
        }

        // Check if payment response already exists
        const existingPayment = await PayUPaymentResponse.findOne({ txnid: data.txnid })

        if (existingPayment) {
          await PayUPaymentResponse.findOneAndUpdate({ txnid: data.txnid }, { $set: paymentData })
        } else {
          await PayUPaymentResponse.create(paymentData)
        }
      } catch (err) {
        console.error('Error storing payment response:', err.message, 'txnid:', txnid, 'foundOrder:', !!foundOrder)
        // Don't fail the payment flow if storing response fails
      }

      // Update order status after successful payment
      // Note: PayU returns mode as CC/DC/NB etc, but we classify it as 'prepaid'
      // Idempotency guard: only update if not already marked paid, preventing double-processing on PayU retries
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
      const successUrl = `${baseUrl}/order-successful?orderId=${txnid}`
      const order = await Order.findOneAndUpdate(
        { _id: txnid, 'paymentDetails.paymentStatus': { $ne: 'paid' } },
        {
          $set: {
            'paymentDetails.paymentStatus': 'paid',
            'paymentDetails.paymentMethod': 'prepaid', // PayU = prepaid, regardless of mode (CC/DC/NB)
            'paymentDetails.transactionId': data.mihpayid || data.txnid,
            'paymentDetails.gateway': 'PayU',
            'paymentDetails.paidAt': new Date(),
            status: 'paid', // Payment successful - awaiting admin confirmation for shipment
          },
          $push: {
            statusLogs: {
              status: 'paid',
              timestamp: new Date(),
              message: `Payment completed successfully via ${data.mode || 'PayU'}`,
            },
          },
        },
        { new: true }
      )
      if (!order) {
        // Payment was already processed (idempotency) or order not found — redirect to success page
        console.log('Order already processed or not found for txnid:', txnid, '— redirecting to success')
        return NextResponse.redirect(successUrl, 303)
      }

      if (order) {
        // Decrement inventory for each ordered item
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            // item.variants is [{name:'Option 1', option: 'Vanilla'}, ...]
            // The first element's option corresponds to option1Value on the Product variant
            const option1Value = item.variants && item.variants[0] ? item.variants[0].option : null
            if (item.productId && option1Value) {
              try {
                await Product.findOneAndUpdate(
                  { _id: item.productId, 'variants.option1Value': option1Value },
                  { $inc: { 'variants.$.inventoryQty': -(item.quantity || 1) } }
                )
              } catch (invErr) {
                console.error(
                  'Failed to decrement inventory for product',
                  item.productId,
                  'variant',
                  option1Value,
                  invErr
                )
              }
            }
          }
        }

        // Increment promo code usage count
        const promoCodeValue = order.couponCode || order.discountCode
        if (promoCodeValue) {
          try {
            await PromoCode.findOneAndUpdate({ code: promoCodeValue }, { $inc: { usageCount: 1 } })
          } catch (promoErr) {
            console.error('Failed to increment promo code usage for code', promoCodeValue, promoErr)
          }
        }

        // Send Order Confirmed Email (customer)
        try {
          await sendOrderConfirmedEmail(order.toObject())
        } catch (emailError) {
          console.error('Failed to send order confirmed email:', emailError)
        }

        // Send Operations alert (internal)
        try {
          await sendOperationsNewOrderEmail(order.toObject(), 'confirmed')
        } catch (opsErr) {
          console.error('Failed to send operations confirmed-order email:', opsErr)
        }

        // Handle Guest Account Creation
        if (order.guestAccountData && order.guestAccountData.createAccount && order.guestAccountData.password) {
          try {
            const createAccountUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/create-guest-account`
            await fetch(createAccountUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...order.guestAccountData,
                orderId: order._id,
              }),
            })

            // Clear sensitive data from order
            await Order.findByIdAndUpdate(order._id, {
              $unset: { 'guestAccountData.password': 1 },
            })
          } catch (err) {
            console.error('Failed to trigger guest account creation:', err)
          }
        }

        // Get user for Shiprocket order creation
        const user = await User.findOne({
          $or: [{ clerkId: order.userId }],
        })

        // Shiprocket order will be created after admin confirms the order
        // Save address data for later Shiprocket creation
        const addressData = order.deliveryAddress || order.shippingAddress

        if (false) {
          // Disabled - will create Shiprocket order on admin confirmation
          // Extract customer details with comprehensive fallbacks
          let customerName, customerAddress, customerCity, customerPincode, customerState, customerEmail, customerPhone

          // Customer Name - try multiple sources
          customerName =
            (order.deliveryAddress?.firstName && order.deliveryAddress?.lastName
              ? `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}`.trim()
              : null) ||
            order.deliveryAddress?.firstName ||
            data.firstname ||
            user?.billing_fullname ||
            'Customer'

          // Address - try multiple sources
          customerAddress =
            order.deliveryAddress?.address ||
            order.deliveryAddress?.address1 ||
            order.shippingAddress?.street ||
            data.address1 ||
            data.address2 ||
            null

          // City - try multiple sources
          customerCity = order.deliveryAddress?.city || order.shippingAddress?.city || data.city || null

          // Pincode - try multiple sources
          customerPincode = order.deliveryAddress?.zipcode || order.shippingAddress?.postalCode || data.zipcode || null

          // State - try multiple sources
          customerState = order.deliveryAddress?.state || order.shippingAddress?.state || data.state || null

          // Email
          customerEmail = order.deliveryAddress?.email || user?.billing_email || data.email || null

          // Phone
          customerPhone = order.deliveryAddress?.phone || user?.billing_phone || data.phone || null

          // Validate required fields before creating Shiprocket order
          if (!customerAddress || !customerCity || !customerPincode || !customerState || !customerPhone) {
            // Skip Shiprocket creation but don't fail the payment
          } else {
            const shiprocketResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/api/delivery-ship/create-order`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  order_id: order._id.toString(),
                  customer: {
                    name: customerName,
                    address: customerAddress,
                    city: customerCity,
                    pincode: customerPincode,
                    state: customerState,
                    email: customerEmail || 'support@example.com',
                    phone: customerPhone,
                  },
                  products: order.items.map((item) => ({
                    name: item.name,
                    sku: item.variants?.[0]?.option || item.productId,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  payment_method: order.paymentDetails?.paymentMethod || 'cod',
                  sub_total: order.totalAmount,
                }),
              }
            )

            if (!shiprocketResponse.ok) {
              const errorText = await shiprocketResponse.text()
              console.error('Failed to create Shiprocket order:', errorText)
              // Even if shiprocket fails, the order is paid. You might want to handle this failure,
              // for example by flagging the order for manual processing.
            } else {
              await shiprocketResponse.json()
            }
          }
        }
      }

      // Use absolute URL for redirect to avoid 405 errors on Vercel
      return NextResponse.redirect(successUrl, 303)
    } else {
      // Payment failed or was cancelled - mark as failed but keep order for retry
      await Order.findByIdAndUpdate(txnid, {
        $set: {
          'paymentDetails.paymentStatus': 'failed',
          status: 'pending_payment', // Keep as pending_payment so user can retry
        },
      })

      try {
        const failedOrder = await Order.findById(txnid).lean()
        if (failedOrder) {
          await sendPaymentFailedEmail(failedOrder)
        }
      } catch (emailError) {
        console.error('Failed to send payment failed email:', emailError)
      }

      // Use absolute URL for redirect
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
      return NextResponse.redirect(`${baseUrl}/payment-failure?orderId=${txnid}`, 303)
    }
  } catch (error) {
    console.error('Error in after-payment success callback:', error)
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 })
  }
}
