import { render, screen, act } from '@testing-library/react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNav } from '@/components/dashboard/TopNav'
import { UserMenu } from '@/components/dashboard/UserMenu'

// Mock next/navigation
const mockUsePathname = jest.fn()
jest.mock('next/navigation', () => ({
    usePathname: () => mockUsePathname(),
}))

describe('Dashboard Layout Components', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Sidebar', () => {
        it('renders navigation links', () => {
            mockUsePathname.mockReturnValue('/dashboard')

            render(<Sidebar />)

            expect(screen.getByText('Purple Glow')).toBeInTheDocument()
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
            expect(screen.getByText('Posts')).toBeInTheDocument()
            expect(screen.getByText('Calendar')).toBeInTheDocument()
            expect(screen.getByText('Analytics')).toBeInTheDocument()
            expect(screen.getByText('Settings')).toBeInTheDocument()
        })

        it('highlights active route', () => {
            mockUsePathname.mockReturnValue('/posts')

            render(<Sidebar />)

            const postsLink = screen.getByText('Posts')
            expect(postsLink).toHaveClass('bg-purple-50', 'text-purple-700')
        })

        it('handles sub-routes correctly', () => {
            mockUsePathname.mockReturnValue('/posts/create')

            render(<Sidebar />)

            const postsLink = screen.getByText('Posts')
            expect(postsLink).toHaveClass('bg-purple-50', 'text-purple-700')
        })
    })

    describe('TopNav', () => {
        it('renders with user information', () => {
            const mockUser = {
                displayName: 'John Doe',
                email: 'john@example.com'
            }

            render(<TopNav user={mockUser} />)

            expect(screen.getByText('Dashboard')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        it('renders with default user when no user provided', () => {
            render(<TopNav />)

            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        it('shows notification bell', () => {
            render(<TopNav />)

            const notificationButton = screen.getByRole('button', { name: /view notifications/i })
            expect(notificationButton).toBeInTheDocument()
        })
    })

    describe('UserMenu', () => {
        const mockUser = {
            displayName: 'John Doe',
            email: 'john@example.com'
        }

        it('renders user avatar with initials', () => {
            render(<UserMenu user={mockUser} />)

            expect(screen.getByText('JD')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        it('shows dropdown menu when clicked', async () => {
            render(<UserMenu user={mockUser} />)

            const menuButton = screen.getByText('John Doe')

            await act(async () => {
                menuButton.click()
            })

            expect(screen.getByText('Settings')).toBeInTheDocument()
            expect(screen.getByText('Logout')).toBeInTheDocument()
        })

        it('displays user information in dropdown', async () => {
            render(<UserMenu user={mockUser} />)

            const menuButton = screen.getByText('John Doe')

            await act(async () => {
                menuButton.click()
            })

            expect(screen.getByText('john@example.com')).toBeInTheDocument()
        })
    })
})