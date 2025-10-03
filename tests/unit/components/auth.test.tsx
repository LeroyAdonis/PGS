import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock Supabase client
const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockResetPasswordForEmail = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
            signUp: mockSignUp,
            resetPasswordForEmail: mockResetPasswordForEmail,
        },
    }),
}))

describe('Authentication Components', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPush.mockClear()
    })

    describe('LoginForm', () => {
        it('renders login form with all fields', () => {
            render(<LoginForm />)

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
        })

        it('submits form with valid data', async () => {
            mockSignInWithPassword.mockResolvedValue({ error: null })

            render(<LoginForm />)

            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'Test1234!' },
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(mockSignInWithPassword).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'Test1234!',
                })
            })

            expect(mockPush).toHaveBeenCalledWith('/dashboard')
        })

        it('shows error on login failure', async () => {
            mockSignInWithPassword.mockResolvedValue({
                error: { message: 'Invalid credentials' },
            })

            render(<LoginForm />)

            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'wrongpassword' },
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
            })
        })
    })

    describe('RegisterForm', () => {
        it('renders registration form with all fields', () => {
            render(<RegisterForm />)

            expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/accept the terms/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
        })

        it('submits form with valid data', async () => {
            mockSignUp.mockResolvedValue({ error: null })

            render(<RegisterForm />)

            fireEvent.change(screen.getByLabelText(/display name/i), {
                target: { value: 'Test User' },
            })
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'Test1234!' },
            })
            fireEvent.click(screen.getByLabelText(/accept the terms/i))
            fireEvent.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'Test1234!',
                    options: {
                        data: {
                            display_name: 'Test User',
                        },
                    },
                })
            })

            expect(mockPush).toHaveBeenCalledWith('/onboarding')
        })
    })

    describe('PasswordResetForm', () => {
        it('renders password reset form', () => {
            render(<PasswordResetForm />)

            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument()
        })

        it('shows success message after sending reset email', async () => {
            mockResetPasswordForEmail.mockResolvedValue({ error: null })

            render(<PasswordResetForm />)

            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.click(screen.getByRole('button', { name: /send reset email/i }))

            await waitFor(() => {
                expect(screen.getByText(/check your email/i)).toBeInTheDocument()
            })
        })
    })
})