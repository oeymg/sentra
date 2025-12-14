'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react'

type MediaGalleryProps = {
  mediaUrls: string[]
  mediaTypes: string[]
}

export default function MediaGallery({ mediaUrls, mediaTypes }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!mediaUrls || mediaUrls.length === 0) return null

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const nextMedia = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % mediaUrls.length)
    }
  }

  const prevMedia = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + mediaUrls.length) % mediaUrls.length)
    }
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid gap-2 ${mediaUrls.length === 1 ? 'grid-cols-1' : mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
        {mediaUrls.map((url, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-gray-900"
          >
            {mediaTypes[index] === 'image' ? (
              <img
                src={url}
                alt={`Review media ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-black ml-1" fill="black" />
                  </div>
                </div>
              </div>
            )}

            {/* More badge */}
            {index === 2 && mediaUrls.length > 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">+{mediaUrls.length - 3}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation */}
            {mediaUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevMedia()
                  }}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextMedia()
                  }}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Media Content */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            >
              {mediaTypes[lightboxIndex] === 'image' ? (
                <img
                  src={mediaUrls[lightboxIndex]}
                  alt={`Review media ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={mediaUrls[lightboxIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                />
              )}
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <span className="text-white text-sm font-medium">
                {lightboxIndex + 1} / {mediaUrls.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
