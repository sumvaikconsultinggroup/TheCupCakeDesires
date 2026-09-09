import connectDb from '@/lib/mongodb'

/**
 * Shared Mongo connection. Do not call mongoose.connect() from routes.
 * Cached on globalThis so Vercel warm isolates reuse one pool (maxPoolSize 10).
 */
export const connectToDB = connectDb
export default connectDb
