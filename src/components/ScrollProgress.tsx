'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const animatedProgress = useSpring(0, {
    stiffness: 120,
    damping: 20,
    mass: 0.2,
  })

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const ratio = docHeight > 0 ? scrollTop / docHeight : 0
      setProgress(Math.min(Math.max(ratio, 0), 1))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    animatedProgress.set(progress)
  }, [progress, animatedProgress])

  return (
    <motion.div
      className="fixed top-0 left-0 h-[3px] bg-black z-[9998] origin-left"
      initial={{ scaleX: 0 }}
      style={{ scaleX: animatedProgress }}
    />
  )
}
