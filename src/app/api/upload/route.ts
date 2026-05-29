import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Allowed file types
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    let uploadType = formData.get('type') as string // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Auto-detect video type if not explicitly specified
    if (!uploadType && file.type.startsWith('video/')) {
      uploadType = 'video'
    }

    // Determine allowed types and max size based on upload type
    let allowedTypes: string[]
    let maxSize: number
    let resourceType: 'image' | 'video'

    if (uploadType === 'video') {
      allowedTypes = allowedVideoTypes
      maxSize = 3 * 1024 * 1024 // 3MB for videos
      resourceType = 'video'
    } else {
      allowedTypes = allowedImageTypes
      maxSize = 5 * 1024 * 1024 // 5MB for images
      resourceType = 'image'
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get folder from formData with proper type handling
    const folderParam = formData.get('folder')
    const folder = resourceType === 'video' 
      ? 'videos' 
      : (typeof folderParam === 'string' ? folderParam : null) || 'images'

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          format: resourceType === 'image' ? 'webp' : undefined,
          transformation: resourceType === 'video' ? [{ quality: 'auto' }] : [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto' }
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      const stream = new Readable()
      stream.push(buffer)
      stream.push(null)
      stream.pipe(uploadStream)
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      filename: result.public_id,
      size: result.bytes,
      type: result.format,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Note: In Next.js App Router, body parsing config is not needed
// The route handler automatically handles FormData
