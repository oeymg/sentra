'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'

type LikeAnimationProps = {
  show: boolean
  onComplete?: () => void
}

export default function LikeAnimation({ show, onComplete }: LikeAnimationProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.8, times: [0, 0.4, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-red-500 blur-3xl opacity-50 rounded-full" />

            {/* Heart icon */}
            <Heart className="w-24 h-24 md:w-32 md:h-32 fill-red-500 text-red-500 relative z-10 drop-shadow-2xl" />

            {/* Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 100,
                  y: Math.sin((i * Math.PI * 2) / 8) * 100,
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
