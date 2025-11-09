'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import type { SyncStatus } from '@/lib/auto-sync'

interface SyncToastProps {
  syncs: SyncStatus[]
  isVisible: boolean
  onClose?: () => void
}

export default function SyncToast({ syncs, isVisible, onClose }: SyncToastProps) {
  if (!isVisible || syncs.length === 0) return null

  const allComplete = syncs.every((s) => s.status === 'success' || s.status === 'error')
  const hasSuccess = syncs.some((s) => s.status === 'success')
  const hasError = syncs.some((s) => s.status === 'error')

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!allComplete ? (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                ) : hasError && !hasSuccess ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <h3 className="font-semibold text-gray-900">
                  {!allComplete
                    ? 'Syncing Reviews...'
                    : hasError && !hasSuccess
                    ? 'Sync Failed'
                    : 'Sync Complete'}
                </h3>
              </div>
              {allComplete && onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sync statuses */}
            <div className="space-y-2">
              {syncs.map((sync, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="mt-0.5">
                    {sync.status === 'syncing' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {sync.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {sync.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                    {sync.status === 'pending' && (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{sync.platform}</p>
                    {sync.message && (
                      <p
                        className={`text-xs ${
                          sync.status === 'error'
                            ? 'text-red-600'
                            : sync.status === 'success'
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {sync.message}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            {!allComplete && (
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(syncs.filter((s) => s.status !== 'pending').length / syncs.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
