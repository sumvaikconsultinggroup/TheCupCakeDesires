import { Document, Schema, model, models } from 'mongoose'

/**
 * Marketing content for the homepage scroll-mask hero (HeroScrollMask).
 * Singleton keyed by `storeId: 'default'` so admins can swap the 4 banner
 * images and edit every visible string without touching code.
 */

export interface IHeroCornerPair {
  line1: string
  line2: string
}

export interface IHeroSettings extends Document {
  storeId: string
  enabled: boolean
  images: string[] // exactly 4 in order

  topLeft: IHeroCornerPair
  topRight: IHeroCornerPair
  bottomLeft: IHeroCornerPair
  bottomRight: IHeroCornerPair

  center: {
    eyebrow: string // e.g. "We create"
    title: string // e.g. "Sweet moments"
    footer: string // e.g. "that delight."
  }

  createdAt: Date
  updatedAt: Date
}

const CornerPairSchema = new Schema<IHeroCornerPair>(
  {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
  },
  { _id: false }
)

const CenterSchema = new Schema(
  {
    eyebrow: { type: String, default: 'We create' },
    title: { type: String, default: 'Sweet moments' },
    footer: { type: String, default: 'that delight.' },
  },
  { _id: false }
)

const HeroSettingsSchema = new Schema<IHeroSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true },
    images: {
      type: [String],
      default: [
        '/images/Banner-1.webp',
        '/images/Banner-2.webp',
        '/images/Banner-3.webp',
        '/images/Banner-4.webp',
      ],
      validate: (v: string[]) => v.length === 4,
    },
    topLeft: {
      type: CornerPairSchema,
      default: () => ({ line1: 'Handcrafted Bakery', line2: 'Baked Fresh Daily' }),
    },
    topRight: {
      type: CornerPairSchema,
      default: () => ({ line1: 'The Cupcake Desire', line2: 'Est. 2012' }),
    },
    bottomLeft: {
      type: CornerPairSchema,
      default: () => ({ line1: 'Signatures', line2: 'Seasonal flavours' }),
    },
    bottomRight: {
      type: CornerPairSchema,
      default: () => ({ line1: 'Gift boxes', line2: 'Custom orders' }),
    },
    center: { type: CenterSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
)

const HeroSettings =
  models?.HeroSettings || model<IHeroSettings>('HeroSettings', HeroSettingsSchema)

export default HeroSettings
