import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(file: File, folder: string = 'products'): Promise<{ url: string; publicId: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'auto',
          transformation: [{ width: 1000, height: 1000, crop: 'limit' }, { quality: 'auto' }, { fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error)
          else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )
      .end(buffer)
  })
}

export default uploadToCloudinary
