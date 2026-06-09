import { Document, Schema, model, models } from 'mongoose'

/**
 * Marketing content for the public /gift-voucher landing page.
 * Singleton document keyed by `storeId: 'default'`.
 * Actual purchase still goes through the `gift-voucher` product/variants in
 * the Product collection — this model only stores presentation content.
 */

export interface IGiftVoucherTier {
  amount: number // 25, 50, 100 — must match an existing variant on the gift-voucher product
  label: string // "$25", "$50", "$100"
  blurb: string // "A small thank-you" / "An after-school treat"
  popular?: boolean // highlight this tier
  recipientSuggestion?: string // "Great for teachers"
}

export interface IGiftVoucherBenefit {
  icon: string // lucide icon name e.g. "Mail", "Clock", "Sparkles"
  title: string
  description: string
}

export interface IGiftVoucherStep {
  title: string
  description: string
}

export interface IGiftVoucherFaq {
  question: string
  answer: string
}

export interface IGiftVoucherPage extends Document {
  storeId: string
  enabled: boolean

  hero: {
    eyebrow: string
    scriptWord: string // "perfect" — rendered in script italic
    headline: string // "The {scriptWord} gift, every time."
    subheadline: string
    image: string // hero image URL
    ctaText: string
  }

  productHandle: string // 'gift-voucher' — links to the live Product

  tiers: IGiftVoucherTier[]
  benefits: IGiftVoucherBenefit[]
  howItWorks: IGiftVoucherStep[]
  faqs: IGiftVoucherFaq[]
  termsContent: string

  closing: {
    eyebrow: string
    headline: string
    body: string
    ctaText: string
  }

  createdAt: Date
  updatedAt: Date
}

const TierSchema = new Schema<IGiftVoucherTier>(
  {
    amount: { type: Number, required: true },
    label: { type: String, required: true },
    blurb: { type: String, default: '' },
    popular: { type: Boolean, default: false },
    recipientSuggestion: { type: String, default: '' },
  },
  { _id: false }
)

const BenefitSchema = new Schema<IGiftVoucherBenefit>(
  {
    icon: { type: String, default: 'Sparkles' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false }
)

const StepSchema = new Schema<IGiftVoucherStep>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false }
)

const FaqSchema = new Schema<IGiftVoucherFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, default: '' },
  },
  { _id: false }
)

const HeroSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Gift cards' },
    scriptWord: { type: String, default: 'perfect' },
    headline: { type: String, default: 'The perfect gift, every time.' },
    subheadline: {
      type: String,
      default:
        'A CupCake Desires gift voucher — redeemable on every cupcake, cake and macaron in our Melbourne kitchen. Delivered by email the moment you order.',
    },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1400&q=80',
    },
    ctaText: { type: String, default: 'Pick a tier' },
  },
  { _id: false }
)

const ClosingSchema = new Schema(
  {
    eyebrow: { type: String, default: 'Quietly thoughtful' },
    headline: { type: String, default: 'Send a little sweetness today.' },
    body: {
      type: String,
      default:
        'Birthdays, thank-yous, just-because moments — a CupCake Desires voucher lands in their inbox in seconds and never expires.',
    },
    ctaText: { type: String, default: 'Choose your amount' },
  },
  { _id: false }
)

const GiftVoucherPageSchema = new Schema<IGiftVoucherPage>(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true },
    hero: { type: HeroSchema, default: () => ({}) },
    productHandle: { type: String, default: 'gift-voucher' },
    tiers: {
      type: [TierSchema],
      default: () => [
        {
          amount: 25,
          label: '$25',
          blurb: 'A small thank-you — pairs with a box of three cupcakes.',
          recipientSuggestion: 'Teachers, neighbours, the bin guy.',
        },
        {
          amount: 50,
          label: '$50',
          blurb: 'Our most-gifted tier — covers a deluxe box or six macarons.',
          popular: true,
          recipientSuggestion: 'Coworkers, mums, in-laws.',
        },
        {
          amount: 100,
          label: '$100',
          blurb: 'A full round cake or a celebration cupcake spread.',
          recipientSuggestion: 'Birthdays, anniversaries, big thank-yous.',
        },
      ],
    },
    benefits: {
      type: [BenefitSchema],
      default: () => [
        {
          icon: 'Mail',
          title: 'Delivered by email',
          description: 'Sent to the recipient in seconds — or to you, to forward when ready.',
        },
        {
          icon: 'Clock',
          title: 'Never expires',
          description: 'Use it next week, next month, next year. We keep it open indefinitely.',
        },
        {
          icon: 'Sparkles',
          title: 'Shop the entire menu',
          description: 'Redeemable on cupcakes, cakes, macarons and themed boxes.',
        },
        {
          icon: 'Heart',
          title: 'Personal message',
          description: 'Add a handwritten-style note that lands in the inbox alongside the voucher.',
        },
      ],
    },
    howItWorks: {
      type: [StepSchema],
      default: () => [
        {
          title: 'Pick your amount',
          description: 'Choose $25, $50 or $100 — or any custom amount in the cart.',
        },
        {
          title: 'Add a personal note',
          description: 'Tell them why you’re sending it. We’ll include it in the email.',
        },
        {
          title: 'Pay securely',
          description: 'Checkout via Stripe — Apple Pay, Google Pay or card.',
        },
        {
          title: 'They get it instantly',
          description: 'A beautifully designed voucher arrives in their inbox within minutes.',
        },
      ],
    },
    faqs: {
      type: [FaqSchema],
      default: () => [
        {
          question: 'When does the voucher arrive?',
          answer:
            'As soon as payment is confirmed — usually within a minute. If you want to send it later, we can schedule it for any future date.',
        },
        {
          question: 'Does it expire?',
          answer: 'No. CupCake Desires vouchers never expire.',
        },
        {
          question: 'Can it be used in part?',
          answer:
            'Yes. If they spend less than the voucher amount, the balance stays on the voucher for next time.',
        },
        {
          question: 'Is it refundable?',
          answer:
            'Vouchers are non-refundable but transferable — they can forward it to someone else any time.',
        },
        {
          question: 'Can I get a physical gift card?',
          answer:
            'Right now we only do digital — it lands in the recipient’s inbox the moment payment clears. Easier to gift, no postage delays.',
        },
      ],
    },
    termsContent: {
      type: String,
      default:
        'Gift vouchers are issued in AUD and redeemable across the entire CupCake Desires online menu. They are non-refundable, do not expire, and the balance carries forward if not used in a single order. Vouchers can be transferred but not exchanged for cash.',
    },
    closing: { type: ClosingSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
)

const GiftVoucherPage =
  models?.GiftVoucherPage ||
  model<IGiftVoucherPage>('GiftVoucherPage', GiftVoucherPageSchema)

export default GiftVoucherPage
