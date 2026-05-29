import { Document, Schema, model, models } from 'mongoose'

export interface ISavedView extends Document {
  userId: string
  name: string
  resource: 'orders' | 'products' | 'customers'
  filters: Record<string, unknown>
  isDefault: boolean
  createdAt: Date
}

const savedViewSchema = new Schema<ISavedView>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      enum: ['orders', 'products', 'customers'],
      required: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Compound index: fast lookup for a user's views on a specific resource
savedViewSchema.index({ userId: 1, resource: 1 })

const SavedView = models?.SavedView || model<ISavedView>('SavedView', savedViewSchema)

export default SavedView
