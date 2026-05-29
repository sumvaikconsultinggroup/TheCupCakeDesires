import mongoose, { Document, Model, Schema } from 'mongoose'

export interface INavigation extends Document {
  type: 'category' | 'mega-product'
  name: string
  handle: string
  description?: string
  image?: string
  link?: string
  isActive: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

const NavigationSchema = new Schema<INavigation>(
  {
    type: {
      type: String,
      enum: ['category', 'mega-product'],
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    handle: { type: String, required: true, lowercase: true, index: true },

    // CATEGORY ONLY
    description: {
      type: String,
      required: function (this: INavigation) {
        return this.type === 'category'
      },
    },
    // MEGA PRODUCT ONLY
    image: {
      type: String,
      required: function (this: INavigation) {
        return this.type === 'mega-product'
      },
    },
    link: {
      type: String,
      required: function (this: INavigation) {
        return this.type === 'mega-product'
      },
    },

    isActive: { type: Boolean, default: true, index: true },
    position: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
)

export const Navigation: Model<INavigation> =
  mongoose.models.Navigation || mongoose.model<INavigation>('Navigation', NavigationSchema)

export default Navigation
