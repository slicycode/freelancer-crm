'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function SSOCallbackPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set a timeout to handle cases where the callback takes too long
    const timeout = setTimeout(() => {
      setIsLoading(false)
      setError('Authentication is taking longer than expected. Please try again.')
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeout)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-6 text-center">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6">
        {isLoading && (
          <div className="text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Completing sign-in...
            </p>
          </div>
        )}

        {/* Add a div with id="clerk-captcha" to prevent CAPTCHA warnings */}
        <div id="clerk-captcha" style={{ display: 'none' }}></div>

        <AuthenticateWithRedirectCallback
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
} 