'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react'

type MediaFile = {
  file: File
  preview: string
  type: 'image' | 'video'
  uploaded: boolean
  url?: string
  progress?: number
}

type MediaUploaderProps = {
  onMediaChange: (mediaUrls: string[], mediaTypes: string[]) => void
  maxFiles?: number
}

export default function MediaUploader({ onMediaChange, maxFiles = 5 }: MediaUploaderProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, maxFiles - mediaFiles.length).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
        uploaded: false,
        progress: 0,
      }))

      setMediaFiles((prev) => [...prev, ...newFiles])
    },
    [mediaFiles.length, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.webm'],
    },
    maxSize: 52428800, // 50MB
    maxFiles: maxFiles - mediaFiles.length,
  })

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Revoke preview URL to avoid memory leaks
      URL.revokeObjectURL(prev[index].preview)

      // Update parent component
      const uploadedFiles = newFiles.filter((f) => f.uploaded)
      onMediaChange(
        uploadedFiles.map((f) => f.url!),
        uploadedFiles.map((f) => f.type)
      )

      return newFiles
    })
  }

  const uploadFile = async (file: File, index: number): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/reviews/upload-media', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const handleUpload = async () => {
    setUploading(true)

    try {
      const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
        if (mediaFile.uploaded) return mediaFile

        try {
          const url = await uploadFile(mediaFile.file, index)
          setMediaFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, uploaded: true, url, progress: 100 } : f
            )
          )
          return { ...mediaFile, uploaded: true, url }
        } catch (error) {
          console.error('Upload error:', error)
          throw error
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      // Update parent component with all uploaded URLs
      onMediaChange(
        uploadedFiles.filter((f) => f.uploaded).map((f) => f.url!),
        uploadedFiles.filter((f) => f.uploaded).map((f) => f.type)
      )
    } catch (error) {
      console.error('Error uploading media:', error)
      alert('Failed to upload some files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Auto-upload when files are added
  const handleFilesAdded = async () => {
    if (mediaFiles.length > 0 && !uploading) {
      await handleUpload()
    }
  }

  // Upload files when added
  useState(() => {
    if (mediaFiles.length > 0 && mediaFiles.some((f) => !f.uploaded)) {
      handleUpload()
    }
  })

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {mediaFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full">
              <Upload className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">
                {isDragActive ? 'Drop files here' : 'Upload photos or videos'}
              </p>
              <p className="text-sm text-gray-400">
                Drag & drop or click • Up to {maxFiles} files • Max 50MB each
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported: JPG, PNG, WEBP, GIF, MP4, MOV, WEBM
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* File Previews */}
      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {mediaFiles.map((mediaFile, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border-2 border-gray-700"
              >
                {/* Preview */}
                {mediaFile.type === 'image' ? (
                  <img
                    src={mediaFile.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Video className="w-12 h-12 text-gray-500" />
                  </div>
                )}

                {/* Upload Progress/Status */}
                {!mediaFile.uploaded && uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-white">Uploading...</p>
                    </div>
                  </div>
                )}

                {mediaFile.uploaded && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 rounded-full">
                    <p className="text-xs font-semibold text-white">✓ Uploaded</p>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1">
                  {mediaFile.type === 'image' ? (
                    <ImageIcon className="w-3 h-3 text-white" />
                  ) : (
                    <Video className="w-3 h-3 text-white" />
                  )}
                  <span className="text-xs text-white capitalize">{mediaFile.type}</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Status */}
      {mediaFiles.length > 0 && (
        <div className="text-sm text-gray-400 flex items-center justify-between">
          <span>
            {mediaFiles.filter((f) => f.uploaded).length} of {mediaFiles.length} uploaded
          </span>
          {uploading && (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </span>
          )}
        </div>
      )}
    </div>
  )
}
