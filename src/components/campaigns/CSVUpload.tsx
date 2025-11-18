'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CSVRecipient {
  name: string
  email: string
  phone?: string
}

interface CSVUploadProps {
  onRecipientsLoaded: (recipients: CSVRecipient[]) => void
  onError?: (error: string) => void
}

export function CSVUpload({ onRecipientsLoaded, onError }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<CSVRecipient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const parseCSV = (text: string): CSVRecipient[] => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIndex = headers.findIndex((h) => h.includes('name'))
    const emailIndex = headers.findIndex((h) => h.includes('email'))
    const phoneIndex = headers.findIndex((h) => h.includes('phone'))

    if (emailIndex === -1) {
      throw new Error('CSV must have an "email" column')
    }

    const parsed: CSVRecipient[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const email = values[emailIndex]

      if (!email) {
        errors.push(`Row ${i + 1}: Missing email address`)
        continue
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Row ${i + 1}: Invalid email format (${email})`)
        continue
      }

      parsed.push({
        name: nameIndex !== -1 ? values[nameIndex] : email.split('@')[0],
        email,
        phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
      })
    }

    setValidationErrors(errors)
    return parsed
  }

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        const errorMsg = 'Please upload a CSV file'
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      setError(null)
      setFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const parsed = parseCSV(text)

          if (parsed.length === 0) {
            throw new Error('No valid recipients found in CSV')
          }

          setRecipients(parsed)
          onRecipientsLoaded(parsed)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to parse CSV'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      }
      reader.readAsText(file)
    },
    [onRecipientsLoaded, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleRemove = () => {
    setFile(null)
    setRecipients([])
    setError(null)
    setValidationErrors([])
  }

  const downloadSampleCSV = () => {
    const sample = `name,email,phone\nJohn Doe,john@example.com,555-1234\nJane Smith,jane@example.com,555-5678`
    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-recipients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 transition-all ${
            isDragging
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-black' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-black mb-2">
              {isDragging ? 'Drop your CSV here' : 'Upload recipient list'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop a CSV file, or click to browse
            </p>
            <label className="cursor-pointer">
              <span className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-block">
                Choose File
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-xl p-6 bg-white"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium text-black">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {recipients.length} recipients loaded
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!error && recipients.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Successfully loaded {recipients.length} recipients
              </p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                ⚠️ {validationErrors.length} rows skipped due to errors:
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {validationErrors.map((error, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {recipients.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Email</th>
                      {recipients.some((r) => r.phone) && (
                        <th className="text-left p-3 font-medium text-gray-700">Phone</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recipients.slice(0, 10).map((recipient, i) => (
                      <tr key={i}>
                        <td className="p-3 text-gray-900">{recipient.name}</td>
                        <td className="p-3 text-gray-600">{recipient.email}</td>
                        {recipients.some((r) => r.phone) && (
                          <td className="p-3 text-gray-600">{recipient.phone || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recipients.length > 10 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    Showing first 10 of {recipients.length} recipients
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={downloadSampleCSV}
          className="inline-flex items-center gap-1 text-black hover:underline"
        >
          <Download className="w-4 h-4" />
          Download sample CSV
        </button>
        <span>•</span>
        <span>Required columns: name, email (phone is optional)</span>
      </div>
    </div>
  )
}
