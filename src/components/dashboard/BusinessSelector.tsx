'use client'

import { useBusinessContext } from '@/contexts/BusinessContext'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function BusinessSelector() {
  const { businesses, selectedBusiness, setSelectedBusinessId } = useBusinessContext()
  const [isOpen, setIsOpen] = useState(false)

  if (businesses.length <= 1) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">{selectedBusiness?.name}</p>
          {selectedBusiness?.suburb && (
            <p className="text-xs text-gray-500">{selectedBusiness.suburb}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-auto">
            {businesses.map((business) => (
              <button
                key={business.id}
                onClick={() => {
                  setSelectedBusinessId(business.id)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedBusiness?.id === business.id ? 'bg-gray-50' : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{business.name}</p>
                {business.suburb && (
                  <p className="text-xs text-gray-500">{business.suburb}</p>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
