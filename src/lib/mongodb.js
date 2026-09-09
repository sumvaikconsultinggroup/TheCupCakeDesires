import mongoose from 'mongoose'

// Prefer IPv4 via mongoose `family: 4` below. Do not statically import Node's
// `dns` here — webpack follows this file from client error logging and cannot
// resolve `dns` in the browser bundle.

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables.')
}

/** Keep Atlas M0 from growing toward its 500-connection cap. */
export const MONGO_POOL_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  maxConnecting: 2,
  waitQueueTimeoutMS: 10000,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  bufferCommands: false,
  family: 4,
}

function uriWithPoolLimits(uri) {
  if (!uri) return uri
  const extras = []
  if (!/[?&]maxPoolSize=/i.test(uri)) extras.push('maxPoolSize=10')
  if (!/[?&]minPoolSize=/i.test(uri)) extras.push('minPoolSize=0')
  if (!/[?&]maxIdleTimeMS=/i.test(uri)) extras.push('maxIdleTimeMS=30000')
  if (!extras.length) return uri
  return `${uri}${uri.includes('?') ? '&' : '?'}${extras.join('&')}`
}

const CONNECTION_URI = uriWithPoolLimits(MONGODB_URI)

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, listenersAdded: false, lastFailAt: 0 }
} else if (typeof cached.lastFailAt !== 'number') {
  cached.lastFailAt = 0
}

const RECONNECT_COOLDOWN_MS = 20000

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) {
    cached.conn = cached.conn || mongoose
    return cached.conn
  }

  // Already connecting on this isolate — reuse the same promise, never open a second client.
  if (cached.promise && (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 0)) {
    return cached.promise
  }

  if (mongoose.connection.readyState === 0) {
    cached.conn = null
    cached.promise = null
  }

  if (cached.lastFailAt && Date.now() - cached.lastFailAt < RECONNECT_COOLDOWN_MS) {
    throw new Error('MongoDB reconnect delayed after recent failure')
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false)

    cached.promise = mongoose
      .connect(CONNECTION_URI, MONGO_POOL_OPTIONS)
      .then((conn) => {
        cached.lastFailAt = 0
        return conn
      })
      .catch((error) => {
        cached.promise = null
        cached.conn = null
        cached.lastFailAt = Date.now()
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.conn = null
    cached.promise = null
    throw error
  }

  if (!cached.listenersAdded) {
    mongoose.connection.on('disconnected', () => {
      if (mongoose.connection.readyState === 0) {
        cached.conn = null
        cached.promise = null
      }
    })

    process.once('SIGINT', gracefulShutdown)
    process.once('SIGTERM', gracefulShutdown)
    cached.listenersAdded = true
  }

  return cached.conn
}

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close()
    process.exit(0)
  } catch {
    process.exit(1)
  }
}

export default connectDb
export { connectDb, connectDb as connectToDB }
