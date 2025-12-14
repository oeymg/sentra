'use client'

import { motion } from 'framer-motion'
import { Play, Heart, MessageCircle, Share2, Eye, ThumbsUp, Star, BadgeCheck } from 'lucide-react'
import { useState } from 'react'

type VideoReview = {
  id: string
  platform: 'instagram' | 'tiktok' | 'youtube' | 'vimeo' | 'twitter' | 'facebook' | 'other'
  video_url: string
  embed_url: string | null
  thumbnail_url: string | null
  creator_name: string
  creator_handle: string | null
  creator_avatar_url: string | null
  creator_follower_count: number | null
  title: string | null
  description: string | null
  duration_seconds: number | null
  view_count: number
  like_count: number
  comment_count: number
  rating: number | null
  is_featured: boolean
  is_verified: boolean
  posted_at: string
}

const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'from-black to-cyan-600',
    bgColor: 'bg-gradient-to-br from-gray-50 to-cyan-50',
    borderColor: 'border-cyan-200',
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: 'from-red-600 to-red-700',
    bgColor: 'bg-gradient-to-br from-red-50 to-orange-50',
    borderColor: 'border-red-200',
  },
  vimeo: {
    name: 'Vimeo',
    icon: '🎬',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'from-black to-gray-800',
    bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
    borderColor: 'border-gray-200',
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
  },
  other: {
    name: 'Video',
    icon: '🎥',
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
    borderColor: 'border-gray-200',
  },
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function VideoReview({ video, index = 0 }: { video: VideoReview; index?: number }) {
  const [showVideo, setShowVideo] = useState(false)
  const [liked, setLiked] = useState(false)

  const config = PLATFORM_CONFIG[video.platform] || PLATFORM_CONFIG.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${config.bgColor} border-2 ${config.borderColor} rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group relative`}
    >
      {/* Featured Badge */}
      {video.is_featured && (
        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-xs font-bold text-white">Featured</span>
        </div>
      )}

      {/* Video Thumbnail/Player */}
      <div className="relative aspect-[9/16] max-h-[600px] bg-black overflow-hidden">
        {!showVideo ? (
          <>
            {/* Thumbnail */}
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title || 'Video review'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                <div className="text-white text-6xl">{config.icon}</div>
              </div>
            )}

            {/* Play Button Overlay */}
            <motion.button
              onClick={() => setShowVideo(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm group-hover:bg-black/40 transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                <Play className="w-10 h-10 text-black ml-1" fill="black" />
              </div>
            </motion.button>

            {/* Video Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              <div className="flex items-center gap-4 text-white text-sm">
                {video.view_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">{formatNumber(video.view_count)}</span>
                  </div>
                )}
                {video.like_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="font-semibold">{formatNumber(video.like_count)}</span>
                  </div>
                )}
                {video.comment_count > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold">{formatNumber(video.comment_count)}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Video Player
          <div className="w-full h-full">
            {video.embed_url ? (
              <iframe
                src={video.embed_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={video.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-6">
        {/* Creator Info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
            {video.creator_avatar_url ? (
              <img src={video.creator_avatar_url} alt={video.creator_name} className="w-full h-full object-cover" />
            ) : (
              <span>{video.creator_name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{video.creator_name}</p>
              {video.is_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </div>
            {video.creator_handle && (
              <p className="text-sm text-gray-600">@{video.creator_handle}</p>
            )}
            {video.creator_follower_count && video.creator_follower_count > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatNumber(video.creator_follower_count)} followers
              </p>
            )}
          </div>
          <div className={`px-3 py-1 bg-gradient-to-r ${config.color} rounded-full`}>
            <span className="text-xs font-semibold text-white">{config.name}</span>
          </div>
        </div>

        {/* Title & Description */}
        {video.title && (
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
        )}
        {video.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{video.description}</p>
        )}

        {/* Rating */}
        {video.rating && video.rating > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-white/80 rounded-xl">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= video.rating!
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {video.rating.toFixed(1)} stars
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <motion.button
            onClick={() => setLiked(!liked)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              liked
                ? 'bg-red-100 text-red-600'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-600' : ''}`} />
            <span className="text-sm font-medium">Helpful</span>
          </motion.button>

          <motion.a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/80 text-gray-700 hover:bg-white transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">View Original</span>
          </motion.a>
        </div>

        {/* Posted Date */}
        <p className="text-xs text-gray-500 text-center mt-3">
          Posted {new Date(video.posted_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </motion.div>
  )
}
