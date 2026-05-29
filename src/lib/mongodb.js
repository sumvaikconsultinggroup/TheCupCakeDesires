import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables.')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, listenersAdded: false }
}

const connectDb = async () => {
  // Return existing healthy connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // Reset if fully disconnected
  if (mongoose.connection.readyState === 0) {
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false)

    // ✅ .catch() chained directly so cached.promise IS the settled promise
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    }).catch((error) => {
      cached.promise = null
      cached.conn = null
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
      cached.conn = null
      cached.promise = null  // ✅ also reset promise on disconnect
    })

    mongoose.connection.on('error', () => {
      cached.conn = null
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