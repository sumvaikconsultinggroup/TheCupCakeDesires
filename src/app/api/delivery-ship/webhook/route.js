import connectDb from "@/lib/mongodb";
import Order from "@/models/Order";
import AWBOrder from "@/models/AWBOrder";

/**
 * Maps Shiprocket's status to your internal order status.
 * @param {string} shiprocketStatus - The status from the Shiprocket webhook.
 * @returns {string|null} The corresponding internal order status, or null if not found.
 */
const getOrderStatus = (shiprocketStatus) => {
  switch (shiprocketStatus.toLowerCase()) {
    case "order received":
      return "confirmed";
    case "order picked/picked":
    case "packed":
      return "processing";
    case "shipped":
    case "in transit/order in transit":
    case "reached destination":
    case "out for delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    case "returned":
      return "refunded";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
};

export async function POST(req) {
  try {
    // ✅ Always use raw body
    const body = await req.text();

    // Debug logs (optional)
    const allHeaders = Object.fromEntries(req.headers.entries());
    // ✅ No signature verification (Shiprocket does not send HMAC)

    // 2. Parse the payload
    const jsonBody = JSON.parse(body);
    const { awb_code, current_status } = jsonBody;

    if (!awb_code || !current_status) {
      return new Response("OK", { status: 200 });
    }

    // 3. Map status
    const orderStatus = getOrderStatus(current_status);

    if (!orderStatus) {
      return new Response("OK", { status: 200 });
    }

    // 4. Update DB
    try {
      await connectDb();

      // Find order by AWB code
      const order = await Order.findOne({
        "shippingDetails.awb_code": awb_code,
      });

      if (order) {
        order.status = orderStatus;
        if (!order.statusLogs) {
          order.statusLogs = [];
        }
        order.statusLogs.push({
          status: orderStatus,
          timestamp: new Date(),
          message: `Shiprocket status update: ${current_status}`,
        });

        await order.save();

        // Save to AWBOrder model
        if (order.orderId) {
          await AWBOrder.findOneAndUpdate(
            { orderId: order.orderId },
            { awb: awb_code },
            { upsert: true, new: true }
          );
        }
      } else {
        // Try to find by AWBOrder if order not found by shippingDetails
        const awbOrder = await AWBOrder.findOne({ awb: awb_code });
        if (awbOrder) {
          const orderByOrderId = await Order.findOne({ orderId: awbOrder.orderId });
          if (orderByOrderId) {
            orderByOrderId.status = orderStatus;
            if (!orderByOrderId.statusLogs) {
              orderByOrderId.statusLogs = [];
            }
            orderByOrderId.statusLogs.push({
              status: orderStatus,
              timestamp: new Date(),
              message: `Shiprocket status update: ${current_status}`,
            });
            await orderByOrderId.save();
          }
        }
      }
    } catch (dbError) {
      console.error("DB Error:", dbError);
      // Still return 200 so Shiprocket doesn't retry
    }

    // 5. Always return 200
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("OK", { status: 200 });
  }
}
