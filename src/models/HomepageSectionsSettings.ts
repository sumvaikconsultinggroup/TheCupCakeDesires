import { Document, Schema, model, models } from 'mongoose'

import {
  getDefaultHomepageSectionsConfig,
  type HomepageProductSectionConfig,
  type HomepageSectionsConfig,
  type HomepageShowcaseSectionConfig,
  type HomepageShowcaseTile,
} from '@/lib/homepage-sections-defaults'

export interface IHomepageSectionsSettings extends Document {
  storeId: string
  sections: HomepageSectionsConfig
  createdAt: Date
  updatedAt: Date
}

const ProductSectionSchema = new Schema<HomepageProductSectionConfig>(
  {
    enabled: { type: Boolean, default: true },
    collectionHandle: { type: String, default: '' },
    layoutStyle: { type: String, enum: ['grid', 'carousel'], default: 'grid' },
    itemsPerRow: { type: Number, default: 4, min: 1, max: 6 },
    maxItems: { type: Number, default: 8, min: 1, max: 50 },
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    titleAccent: { type: String, default: '' },
    description: { type: String, default: '' },
    ctaLabel: { type: String, default: '' },
    ctaHref: { type: String, default: '' },
  },
  { _id: false }
)

const ShowcaseTileSchema = new Schema<HomepageShowcaseTile>(
  {
    collectionHandle: { type: String, default: '' },
    imageOverride: { type: String, default: '' },
    tagline: { type: String, default: '' },
    blurb: { type: String, default: '' },
    badge: { type: String, default: '' },
    span: { type: String, enum: ['short', 'wide'], default: 'short' },
  },
  { _id: false }
)

const ShowcaseSectionSchema = new Schema<HomepageShowcaseSectionConfig>(
  {
    enabled: { type: Boolean, default: true },
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    titleAccent: { type: String, default: '' },
    description: { type: String, default: '' },
    ctaLabel: { type: String, default: '' },
    ctaHref: { type: String, default: '' },
    tiles: { type: [ShowcaseTileSchema], default: [] },
  },
  { _id: false }
)

const HomepageSectionsSettingsSchema = new Schema<IHomepageSectionsSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    sections: {
      type: new Schema(
        {
          best_sellers: { type: ProductSectionSchema, default: () => ({}) },
          flash_deals: { type: ProductSectionSchema, default: () => ({}) },
          new_arrivals: { type: ProductSectionSchema, default: () => ({}) },
          featured: { type: ProductSectionSchema, default: () => ({}) },
          trending: { type: ProductSectionSchema, default: () => ({}) },
          occasion_showcase: { type: ShowcaseSectionSchema, default: () => ({}) },
          category_showcase: { type: ShowcaseSectionSchema, default: () => ({}) },
        },
        { _id: false }
      ),
      default: () => getDefaultHomepageSectionsConfig(),
    },
  },
  { timestamps: true, versionKey: false }
)

const HomepageSectionsSettings =
  models?.HomepageSectionsSettings ||
  model<IHomepageSectionsSettings>('HomepageSectionsSettings', HomepageSectionsSettingsSchema)

export default HomepageSectionsSettings
