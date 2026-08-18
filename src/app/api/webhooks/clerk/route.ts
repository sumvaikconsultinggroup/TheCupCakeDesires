// app/api/webhooks/clerk/route.ts
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import User from "@/models/User";
import { connectToDB } from "@/utils/db";
import { sendWelcomeEmail } from "@/lib/email-service";

export const runtime = "nodejs"; // mongoose requires node runtime

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET not set in env");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Read raw body for Svix verification
    const rawBody = await req.text();
    // Read svix headers (case-insensitive)
    const svix_id = req.headers.get("svix-id") ?? "";
    const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
    const svix_signature = req.headers.get("svix-signature") ?? "";

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers:", { svix_id, svix_timestamp, svix_signature });
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    // Verify webhook
    let evt: any;
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      evt = wh.verify(rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });

    } catch (err: any) {
      console.error("Error verifying webhook:", err?.message ?? err);
      return NextResponse.json(
        { error: "Webhook verification failed", details: err?.message ?? "unknown" },
        { status: 401 }
      );
    }

    // Event type
    const eventType: string = evt?.type;
    const eventData: any = evt?.data ?? evt?.body ?? null;

    if (!eventType) {
      console.error("No event type:", evt);
      return NextResponse.json({ message: "No event type" }, { status: 200 });
    }

    // Connect DB
    await connectToDB();

    // -------------------------
    // Extract correct user payload
    // -------------------------
    const getUserPayload = (type: string, data: any) => {
      if (type === "session.created" || type === "sessions.session.created") {
        return data?.user ?? null; // nested user object
      }
      return data; // user.created / user.updated payload

    };

    // -------------------------
    // Extract user fields safely
    // -------------------------
    const extractUserFields = (user: any) => {
      if (!user) return { id: null, email: null, first_name: "", last_name: "" };

      const email =
        user?.email_addresses?.[0]?.email_address ??
        user?.primary_email_address?.email_address ??
        user?.email ??
        user?.external_accounts?.[0]?.email_address ??
        null;

      const first_name =
        user?.first_name ?? user?.firstName ?? user?.given_name ?? "";

      const last_name =
        user?.last_name ?? user?.lastName ?? user?.family_name ?? "";

      const id = user?.id ?? user?.user_id ?? null;

      return { id, email, first_name, last_name };
    };

    // Auto-create/update user for:
    // - session.created
    // - user.created
    // - users.user.created
    if (
      eventType === "session.created" ||
      eventType === "sessions.session.created" ||
      eventType === "user.created" ||
      eventType === "users.user.created"
    ) {
      const userPayload = getUserPayload(eventType, eventData);

      if (!userPayload) {
        console.error("No user payload in event:", eventType, eventData);
        return NextResponse.json({ error: "No user payload" }, { status: 400 });
      }

      const { id: clerkId, email, first_name, last_name } =
        extractUserFields(userPayload);

      if (!clerkId) {
        console.error("Missing clerkId in payload:", userPayload);
        return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
      }

      let user = await User.findOne({ clerkId })
      if (!user && email) {
        user = await User.findOne({
          email: { $regex: `^${String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        })
        if (user && !user.clerkId) {
          user.clerkId = clerkId
          if (email) user.email = email
          await user.save()
        }
      }
      if (user) {
        return NextResponse.json({ message: "User already exists" }, { status: 200 });
      }

      user = await User.create({
        clerkId,
        email: email,
        billing_customer_name: first_name || "",
        billing_last_name: last_name || "",
        billing_phone: "",
        billing_customer_gender: "other",
        billing_address: [],
        wishlist: [],
        orders: [],
      });

      await user.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(user.toObject());
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      return NextResponse.json(
        { message: "User created", userId: user._id },
        { status: 200 }
      );
    }

    // -------------------------
    // Update user
    // -------------------------
    if (
      eventType === "user.updated" ||
      eventType === "users.user.updated"
    ) {
      const userPayload = getUserPayload(eventType, eventData);
      const { id: clerkId, email, first_name, last_name } =
        extractUserFields(userPayload);

      await User.findOneAndUpdate(
        { clerkId },
        {
          email: email,
          billing_customer_name: first_name || "",
          billing_last_name: last_name || "",
        },
        { new: true }
      );

      return NextResponse.json({ message: "User updated" }, { status: 200 });
    }

    // -------------------------
    // Delete user
    // -------------------------
    if (
      eventType === "user.deleted" ||
      eventType === "users.user.deleted"
    ) {
      const clerkId = eventData?.id;
      if (!clerkId) {
        return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
      }

      await User.findOneAndDelete({ clerkId });
      return NextResponse.json({ message: "User deleted" }, { status: 200 });
    }

    // -------------------------
    // Unhandled event
    // -------------------------
    return NextResponse.json({ message: "Unhandled event", eventType }, { status: 200 });

  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
