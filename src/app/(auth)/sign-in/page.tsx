'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6">
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
              card: "bg-white dark:bg-gray-800 shadow-lg",
              headerTitle: "text-gray-900 dark:text-gray-100",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600",
              formFieldLabel: "text-gray-700 dark:text-gray-300",
              formFieldInput: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
              footerActionLink: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300",
            },
          }}
        />
      </div>
    </div>
  )
}