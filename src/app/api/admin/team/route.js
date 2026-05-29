import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

// Helper to get current admin user from token
async function getCurrentAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    )

    await connectDb()
    const adminUser = await AdminUser.findById(decoded.userId).select('-password')
    return adminUser
  } catch (error) {
    return null
  }
}

// GET - Fetch all team members
export async function GET(req) {
  try {
    const currentAdmin = await getCurrentAdminUser()
    
    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    // Check if current user has permission to access settings
    if (
      currentAdmin.role !== 'owner' &&
      !currentAdmin.permissions.includes('/admin/settings')
    ) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const members = await AdminUser.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      members: members.map(m => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        role: m.role,
        permissions: m.permissions,
        avatar: m.avatar,
        status: 'active',
        lastActive: m.lastLogin
          ? new Date(m.lastLogin).toLocaleString()
          : 'Never',
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// POST - Add new team member (Owner only)
export async function POST(req) {
  try {
    const currentAdmin = await getCurrentAdminUser()
    
    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    if (currentAdmin.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Only owners can add team members' },
        { status: 403 }
      )
    }

    const { email, role, name } = await req.json()

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: 'Email and role are required' },
        { status: 400 }
      )
    }

    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      )
    }

    const randomPassword = crypto.randomBytes(12).toString('hex')

    const newUser = await AdminUser.create({
      email: email.toLowerCase(),
      password: randomPassword,
      name: name || email.split('@')[0],
      role,
      permissions:
        DEFAULT_PERMISSIONS[role] || [],
      isActive: true,
    })

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}admin/login`

    // Create a fresh transporter for this request
    const emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    try {
      // Verify connection first
      await emailTransporter.verify()
      
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Gibbon Nutrition Admin',
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#1B198F;padding:24px 40px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Gibbon Nutrition</p>
</td>
</tr>
<tr>
<td style="padding:36px 40px;">
<h2 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">Admin Team Invitation</h2>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">You have been added by <strong>${currentAdmin.name}</strong> to join the admin team as <strong>${role}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f9fafb;border-radius:4px;">
<tr><td style="padding:16px;">
<p style="margin:0 0 12px;font-size:14px;color:#111827;font-weight:600;">Your Login Credentials</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${email}</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Password</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;font-family:monospace;">${randomPassword}</td></tr>
</table>
</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr><td align="center" style="border-radius:4px;background-color:#1B198F;">
<a href="${loginUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Log In to Admin Panel</a>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;"><strong>Important:</strong> Please change your password after your first login.</p>
<p style="margin:0;font-size:13px;color:#6b7280;">If you did not expect this email, please contact the administrator.</p>
</td>
</tr>
<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0;color:#9ca3af;font-size:11px;">Gibbon Nutrition. All rights reserved.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>
        `,
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Delete the created user if email fails
      await AdminUser.findByIdAndDelete(newUser._id)
      return NextResponse.json(
        { success: false, message: `Failed to send welcome email: ${emailError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team member added successfully',
      member: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
        permissions: newUser.permissions,
      },
    })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
