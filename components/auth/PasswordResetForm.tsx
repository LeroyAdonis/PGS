'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { passwordResetRequestSchema, type PasswordResetRequestInput } from '@/lib/validation/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/hooks/use-toast'

interface PasswordResetFormProps {
    onSuccess?: () => void
}

export function PasswordResetForm({ onSuccess }: PasswordResetFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PasswordResetRequestInput>({
        resolver: zodResolver(passwordResetRequestSchema),
    })

    const onSubmit = async (data: PasswordResetRequestInput) => {
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                toast({
                    title: 'Reset Failed',
                    description: error.message,
                    variant: 'destructive',
                })
                return
            }

            setIsSuccess(true)
            toast({
                title: 'Reset Email Sent',
                description: 'Check your email for password reset instructions.',
            })

            onSuccess?.()
        } catch (error) {
            toast({
                title: 'Reset Failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-4">
                <div className="text-green-600 text-2xl">✓</div>
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                    We&apos;ve sent you a password reset link. Click the link in the email to reset your password.
                </p>
                <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="w-full"
                >
                    Send another email
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>
        </form>
    )
}