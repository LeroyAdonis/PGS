import { Bell, Menu } from 'lucide-react'
import { UserMenu } from './UserMenu'

interface TopNavProps {
    user?: {
        displayName: string
        email: string
    }
    onMobileMenuClick?: () => void
}

export function TopNav({ user, onMobileMenuClick }: TopNavProps) {
    // Mock user data for now
    const mockUser = user || {
        displayName: 'John Doe',
        email: 'john@example.com'
    }

    return (
        <div className="flex h-16 items-center justify-between px-6 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-md">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                </button>

                {/* User menu */}
                <UserMenu user={mockUser} />
            </div>
        </div>
    )
}