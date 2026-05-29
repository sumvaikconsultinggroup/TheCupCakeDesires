'use client'

import { AlertCircle, Camera, ImageIcon, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  placeholder?: string
  aspectRatio?: 'square' | 'video' | 'banner' | 'portrait' | 'auto'
  maxSizeMB?: number
  className?: string
  showPreview?: boolean
  label?: string
  hint?: string
  base64?: boolean
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  placeholder = 'Upload image or paste URL',
  aspectRatio = 'auto',
  maxSizeMB = 5,
  className = '',
  showPreview = true,
  label,
  hint,
  base64 = false
}: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentImage, setCurrentImage] = useState(value || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update currentImage when value prop changes
  useEffect(() => {
    setCurrentImage(value || '')
    setError(null) // Clear any previous errors when value changes
  }, [value])

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    portrait: 'aspect-[3/4]',
    auto: 'min-h-[200px]'
  }

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url) || 
             url.includes('unsplash.com') || 
             url.includes('cloudinary.com') ||
             url.includes('cdn.shopify.com') ||
             url.includes('images.') ||
             url.includes('/image')
    } catch {
      return false
    }
  }

  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (err) {
      throw new Error('Failed to convert URL to base64')
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Compress and convert to WebP
      const compressAndConvert = async (inputFile: File): Promise<File> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          const reader = new FileReader()
          
          reader.onload = (e) => {
            img.src = e.target?.result as string
          }
          
          reader.onerror = (err) => reject(err)
          
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Failed to get canvas context'))
              return
            }
            ctx.drawImage(img, 0, 0)
            
            let quality = 0.9
            const targetSize = 1024 * 1024 // 1MB
            
            const attemptCompression = () => {
              canvas.toBlob((blob) => {
                if (!blob) {
                  reject(new Error('Compression failed'))
                  return
                }
                
                if (blob.size > targetSize && quality > 0.1) {
                  quality -= 0.1
                  attemptCompression()
                } else {
                  const newFile = new File([blob], inputFile.name.replace(/\.[^/.]+$/, "") + ".webp", {
                    type: 'image/webp',
                    lastModified: Date.now()
                  })
                  resolve(newFile)
                }
              }, 'image/webp', quality)
            }
            
            attemptCompression()
          }
          
          reader.readAsDataURL(inputFile)
        })
      }

    

      const processedFile = await compressAndConvert(file)

      if (processedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`Image must be less than ${maxSizeMB}MB`)
        setIsUploading(false)
        return
      }

      if (base64) {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        const reader = new FileReader()
        reader.onloadend = () => {
          clearInterval(progressInterval)
          const base64String = reader.result as string
          setUploadProgress(100)
          setCurrentImage(base64String)
          onChange(base64String)
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(0)
          }, 500)
        }
        reader.onerror = () => {
          clearInterval(progressInterval)
          setError('Failed to read file')
          setIsUploading(false)
        }
        reader.readAsDataURL(processedFile)
      } else {
        const formData = new FormData()
        formData.append('file', processedFile)

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        clearInterval(progressInterval)

        if (!res.ok) {
          throw new Error('Upload failed')
        }

        const data = await res.json()
        
        if (data.success && data.url) {
          setUploadProgress(100)
          setCurrentImage(data.url)
          onChange(data.url)
        } else {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            setCurrentImage(base64String)
            onChange(base64String)
            setUploadProgress(100)
          }
          reader.readAsDataURL(processedFile)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Failed to process file')
      setIsUploading(false)
    } finally {
      if (!base64) {
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      }
    }
  }, [maxSizeMB, onChange, base64])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleUrlSubmit = async () => {
    setError(null)
    
    if (!urlInput.trim()) {
      setError('Please enter an image URL')
      return
    }

    if (!validateImageUrl(urlInput)) {
      setError('Please enter a valid image URL')
      return
    }

    if (base64) {
      setIsUploading(true)
      setUploadProgress(0)
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 100)

      try {
        const base64String = await urlToBase64(urlInput.trim())
        clearInterval(progressInterval)
        setUploadProgress(100)
        setCurrentImage(base64String)
        onChange(base64String)
        setUrlInput('')
        
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      } catch (err) {
        clearInterval(progressInterval)
        setError('Failed to load image from URL. Please try uploading instead.')
        setIsUploading(false)
        setUploadProgress(0)
      }
    } else {
      setCurrentImage(urlInput.trim())
      onChange(urlInput.trim())
      setUrlInput('')
    }
  }

  const handleRemove = () => {
    setCurrentImage('')
    onChange('')
    setUrlInput('')
    setError(null)
    onRemove?.()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}

      {/* Preview or Upload Area */}
      {currentImage && showPreview ? (
        <div className={`relative overflow-hidden rounded-xl border-2 border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 ${aspectRatioClasses[aspectRatio]}`}>
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setError('Failed to load image')}
          />
          <div className="absolute inset-0 bg-black/0 transition-all hover:bg-black/40 group">
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="rounded-lg bg-white p-2 shadow-lg transition-transform hover:scale-110"
                title="Replace image"
              >
                <Camera className="h-5 w-5 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="rounded-lg bg-red-500 p-2 shadow-lg transition-transform hover:scale-110"
                title="Remove image"
              >
                <Trash2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === 'upload'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === 'url'
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Link2 className="h-4 w-4" />
              URL
            </button>
          </div>

          {/* Upload Mode */}
          <AnimatePresence mode="wait">
            {mode === 'upload' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${aspectRatioClasses[aspectRatio]} flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
                    <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-neutral-500">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <ImageIcon className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Drop your image here, or click to browse
                    </p>
                    <p className="text-xs text-neutral-500">
                      PNG, JPG, GIF, WebP up to {maxSizeMB}MB
                    </p>
                    {base64 && (
                      <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Image will be embedded as base64
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={isUploading}
                    className="rounded-lg bg-[#1B198F] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1B198F]/90 disabled:opacity-50"
                  >
                    {isUploading ? 'Loading...' : 'Add'}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  Enter a direct link to an image (JPG, PNG, GIF, WebP)
                  {base64 && ' - will be converted to base64'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  )
}