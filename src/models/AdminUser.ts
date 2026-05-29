import bcrypt from 'bcryptjs'
import { Document, Schema, model, models } from 'mongoose'

export interface IAdminUser extends Document {
  _id: string
  email: string
  password: string
  name: string
  role: 'owner' | 'admin' | 'staff'
  permissions: string[]
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'staff'],
      default: 'staff',
    },
    permissions: [
      {
        type: String,
        enum: [
          '/admin',
          '/admin/orders',
          '/admin/payments',
          '/admin/homepage',
          '/admin/videos',
          '/admin/navigation',
          '/admin/blog',
          '/admin/reviews',
          '/admin/combos',
          '/admin/recommendations',
          '/admin/products',
          '/admin/collections',
          '/admin/bundles',
          '/admin/inventory',
          '/admin/customers',
          '/admin/discounts',
          '/admin/analytics',
          '/admin/reports',
          '/admin/finance',
          '/admin/analytics/live-activity',
          '/admin/analytics/abandoned-carts',
          '/admin/settings',
          '/admin/product-auth',
          '/admin/seo',
        ],
      },
    ],
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true, versionKey: false }
)

// Hash password before saving
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
adminUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Default permissions by role
export const DEFAULT_PERMISSIONS = {
  owner: [
    '/admin',
    '/admin/orders',
    '/admin/payments',
    '/admin/homepage',
    '/admin/videos',
    '/admin/navigation',
    '/admin/blog',
    '/admin/reviews',
    '/admin/combos',
    '/admin/recommendations',
    '/admin/products',
    '/admin/collections',
    '/admin/bundles',
    '/admin/inventory',
    '/admin/customers',
    '/admin/discounts',
    '/admin/analytics',
    '/admin/reports',
    '/admin/finance',
    '/admin/analytics/live-activity',
    '/admin/analytics/abandoned-carts',
    '/admin/settings',
    '/admin/product-auth',
    '/admin/seo',
  ],
  admin: [
    '/admin',
    '/admin/orders',
    '/admin/payments',
    '/admin/homepage',
    '/admin/videos',
    '/admin/navigation',
    '/admin/blog',
    '/admin/reviews',
    '/admin/combos',
    '/admin/recommendations',
    '/admin/products',
    '/admin/collections',
    '/admin/bundles',
    '/admin/inventory',
    '/admin/customers',
    '/admin/discounts',
    '/admin/analytics',
    '/admin/reports',
    '/admin/finance',
    '/admin/analytics/live-activity',
    '/admin/analytics/abandoned-carts',
  ],
  staff: ['/admin', '/admin/orders', '/admin/products', '/admin/inventory'],
}

const AdminUser = models?.AdminUser || model<IAdminUser>('AdminUser', adminUserSchema)

export default AdminUser
