import { Document, Schema, model, models } from 'mongoose'

/**
 * Fixed-window request counters. One doc per (key, window); Mongo's TTL index
 * deletes it once the window has passed.
 */
export interface IRateLimit extends Document {
  key: string
  count: number
  expiresAt: Date
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false }
)

const RateLimit = models?.RateLimit || model<IRateLimit>('RateLimit', RateLimitSchema)

export default RateLimit
