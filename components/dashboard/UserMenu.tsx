import { useState } from 'react'
import { LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: {
    displayName: string
    email: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const initials = user.displayName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect to login even if there's an error
      window.location.href = '/login'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">{initials}</span>
        </div>
        <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen ? 'rotate-180' : '')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <a
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </a>

            <button
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
