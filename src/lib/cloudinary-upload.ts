import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImageIfNeeded(
  value: string | undefined,
  folder: string
): Promise<string | undefined> {
  if (!value) return value
  if (!value.startsWith('data:image')) return value
  const result = await cloudinary.uploader.upload(value, { folder })
  return result.secure_url
}
