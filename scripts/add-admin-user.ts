/**
 * Script to add an admin user to the system
 * Usage: npx tsx scripts/add-admin-user.ts
 */

import connectDb from '../src/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '../src/models/AdminUser'

async function addAdminUser() {
  try {
    await connectDb()
 
    const email = 'madhav@sumvaik.com'
    const password = 'M@dhav@2025'
    const name = 'madhavsumvaik10' // Using GitHub username as name
    const role = 'admin' // You can change this to 'owner' if needed

    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() })
    if (existingUser) {
     
      return
    }

    // Create new admin user
    const newUser = await AdminUser.create({
      email: email.toLowerCase(),
      password: password,
      name: name,
      role: role,
      permissions: DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.admin,
      isActive: true,
    })

  } catch (error: any) {
    if (error.code === 11000) {
    }
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Run the script
addAdminUser()
