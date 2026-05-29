'use client'
import { useUser } from '@clerk/nextjs'

export default function Profile() {
  const { isLoaded, isSignedIn, user } = useUser()

  // IMPORTANT: Check isLoaded first
  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Not signed in</div>
  }


  
  return (
    <div>
      <h1>Hello, {user?.firstName || 'User'}!</h1>
      <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  )
}