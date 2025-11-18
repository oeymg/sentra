'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

interface UnsubscribePageProps {
  params: Promise<{ token: string }>
}

export default function UnsubscribePage({ params }: UnsubscribePageProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isUnsubscribed, setIsUnsubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (token) {
      checkUnsubscribeStatus()
    }
  }, [token])

  const checkUnsubscribeStatus = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/unsubscribe?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setEmail(data.email)
        setIsUnsubscribed(data.isUnsubscribed)
        setSuccess(data.isUnsubscribed)
      } else {
        setError(data.error || 'Invalid unsubscribe link')
      }
    } catch (err) {
      console.error('Error checking unsubscribe status:', err)
      setError('Failed to load unsubscribe page')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!token) return

    try {
      setUnsubscribing(true)
      setError(null)

      const response = await fetch('/api/campaigns/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setIsUnsubscribed(true)
      } else {
        setError(data.error || 'Failed to unsubscribe')
      }
    } catch (err) {
      console.error('Error unsubscribing:', err)
      setError('Failed to unsubscribe. Please try again.')
    } finally {
      setUnsubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-black mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Homepage
          </Link>
        </motion.div>
      </div>
    )
  }

  if (success || isUnsubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-black mb-2">Successfully Unsubscribed</h1>
          <p className="text-gray-600 mb-6">
            {email && (
              <>
                <span className="font-medium">{email}</span> has been unsubscribed from future campaign emails.
              </>
            )}
            {!email && 'You have been unsubscribed from future campaign emails.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will no longer receive review request emails from this business.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Homepage
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
      >
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-black mb-2">Unsubscribe from Emails</h1>
          {email && (
            <p className="text-gray-600">
              Would you like to unsubscribe <span className="font-medium">{email}</span> from receiving review request emails?
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {unsubscribing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Unsubscribing...
              </>
            ) : (
              'Unsubscribe'
            )}
          </button>

          <Link
            href="/"
            className="block w-full px-6 py-3 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          After unsubscribing, you will no longer receive review request emails from this business.
        </p>
      </motion.div>
    </div>
  )
}
