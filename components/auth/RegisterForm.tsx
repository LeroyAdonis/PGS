'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validation/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/hooks/use-toast'

interface RegisterFormProps {
    onSuccess?: () => void
    redirectTo?: string
}

export function RegisterForm({ onSuccess, redirectTo = '/onboarding' }: RegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        display_name: data.displayName,
                    },
                },
            })

            if (error) {
                toast({
                    title: 'Registration Failed',
                    description: error.message,
                    variant: 'destructive',
                })
                return
            }

            toast({
                title: 'Registration Successful!',
                description: 'Please check your email to verify your account.',
            })

            onSuccess?.()
            router.push(redirectTo)
        } catch (error) {
            toast({
                title: 'Registration Failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                </label>
                <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your display name"
                    {...register('displayName')}
                    disabled={isLoading}
                />
                {errors.displayName && (
                    <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                    disabled={isLoading}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register('password')}
                    disabled={isLoading}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="acceptTerms"
                    type="checkbox"
                    {...register('acceptTerms')}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border border-input"
                />
                <label htmlFor="acceptTerms" className="text-sm">
                    I accept the{' '}
                    <a href="/terms" className="text-primary underline hover:no-underline">
                        Terms and Conditions
                    </a>
                </label>
            </div>
            {errors.acceptTerms && (
                <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
        </form>
    )
}