'use client'

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

interface Props {
  className?: string
}

export default function AvatarDropdown({ className }: Props) {
  return (
    <div className={className}>
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors">
              Login
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-sm font-medium bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </SignedIn>
    </div>
  )
}
