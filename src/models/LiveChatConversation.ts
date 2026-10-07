import { Document, Schema, Types, model, models } from 'mongoose'

export type LiveChatAuthor = 'customer' | 'team' | 'system'
export type LiveChatChannel = 'web' | 'whatsapp' | 'admin_panel'

export interface ILiveChatMessage {
  _id: Types.ObjectId
  from: LiveChatAuthor
  text: string
  via: LiveChatChannel
  /** Display name of the team member who replied (admin panel replies). */
  authorName?: string
  createdAt: Date
}

export interface ILiveChatConversation extends Document {
  /** Short code shown to the team on WhatsApp, e.g. "K7QF". */
  code: string
  /** sha256 of the browser token — the raw token only lives in the visitor's localStorage. */
  visitorTokenHash: string
  name: string
  email?: string
  phone?: string
  company?: string
  pageUrl?: string
  ipHash?: string
  status: 'open' | 'closed'
  messages: Types.DocumentArray<ILiveChatMessage & Document>
  /**
   * Every WhatsApp message id tied to this chat: alerts we sent to the team
   * (so a swipe-reply maps back here) and inbound replies (webhook dedupe).
   */
  waMessageIds: string[]
  unreadForTeam: number
  lastCustomerMessageAt?: Date
  lastTeamMessageAt?: Date
  /** Updated by the widget's polling — tells us whether to email a reply. */
  lastCustomerSeenAt?: Date
  lastReplyEmailAt?: Date
  /** True when the last WhatsApp alert failed — surfaced in the admin inbox. */
  whatsappDeliveryFailed?: boolean
  createdAt: Date
  updatedAt: Date
}

const LiveChatMessageSchema = new Schema<ILiveChatMessage>(
  {
    from: { type: String, enum: ['customer', 'team', 'system'], required: true },
    text: { type: String, required: true, maxlength: 4000 },
    via: { type: String, enum: ['web', 'whatsapp', 'admin_panel'], required: true },
    authorName: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const LiveChatConversationSchema = new Schema<ILiveChatConversation>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    visitorTokenHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    company: { type: String, trim: true, maxlength: 160 },
    pageUrl: { type: String, trim: true, maxlength: 500 },
    ipHash: { type: String, select: false },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    messages: { type: [LiveChatMessageSchema], default: [] },
    waMessageIds: { type: [String], default: [], select: false },
    unreadForTeam: { type: Number, default: 0 },
    lastCustomerMessageAt: Date,
    lastTeamMessageAt: Date,
    lastCustomerSeenAt: Date,
    lastReplyEmailAt: Date,
    whatsappDeliveryFailed: { type: Boolean, default: false },
  },
  { timestamps: true }
)

LiveChatConversationSchema.index({ waMessageIds: 1 })
LiveChatConversationSchema.index({ status: 1, updatedAt: -1 })
LiveChatConversationSchema.index({ ipHash: 1, createdAt: -1 })

export default models.LiveChatConversation ||
  model<ILiveChatConversation>('LiveChatConversation', LiveChatConversationSchema)
