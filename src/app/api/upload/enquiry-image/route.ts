import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'
import { Readable } from 'stream'
import { validateOrigin } from '@/lib/origin-validation'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/** Storefront inspiration-photo upload for dress-cake enquiries. */
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024
const FOLDER = 'dress-cake-enquiries'

export async function POST(request: Request) {
  const originError = validateOrigin(request)
  if (originError) return originError

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image uploads are not configured. Please email your inspiration photo to info@thecupcakedesire.com.au.',
        },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Please choose a file to upload.' }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Please upload a PNG, JPG or WEBP image.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'That file is too large — please keep your photo under 4MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER,
          resource_type: 'image',
          transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
        },
        (error, uploaded) => {
          if (error || !uploaded) reject(error || new Error('Upload failed'))
          else resolve(uploaded as { secure_url: string; public_id: string })
        }
      )
      const stream = new Readable()
      stream.push(buffer)
      stream.push(null)
      stream.pipe(uploadStream)
    })

    return NextResponse.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (error: unknown) {
    console.error('[upload/enquiry-image]', error)
    return NextResponse.json(
      { success: false, error: 'We could not upload that image. Please try again.' },
      { status: 500 }
    )
  }
}
