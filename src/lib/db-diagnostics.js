/**
 * Database Diagnostics Utility
 * Helps debug MongoDB connection issues
 */

import mongoose from 'mongoose'

export async function checkDatabaseConnection() {
  const diagnostics = {
    mongodbUri: process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'not set',
    connectionState: 'unknown',
    error: null,
  }

  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      diagnostics.error = 'MONGODB_URI environment variable is not set'
      return diagnostics
    }

    // Check current connection state
    if (mongoose.connection.readyState) {
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      }
      diagnostics.connectionState = states[mongoose.connection.readyState] || 'unknown'
    }

    // Try to ping the database
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping()
      diagnostics.connectionState = 'connected and ping successful'
    } else {
      diagnostics.error = `Connection state is: ${diagnostics.connectionState}`
    }
  } catch (error) {
    diagnostics.error = error.message
    diagnostics.connectionState = 'error'
  }

  return diagnostics
}

export function logDatabaseDiagnostics() {
  if (mongoose.connection.readyState !== undefined) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }
  }
}
