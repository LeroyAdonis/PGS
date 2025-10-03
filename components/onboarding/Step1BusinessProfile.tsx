'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBusinessProfileSchema, type CreateBusinessProfileInput } from '@/lib/validation/business-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus } from 'lucide-react'

interface Step1BusinessProfileProps {
    onNext: (data: CreateBusinessProfileInput) => void
    initialData?: Partial<CreateBusinessProfileInput>
    isLoading?: boolean
    error?: string | null
}

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'humorous', label: 'Humorous' },
] as const

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'zu', label: 'Zulu' },
    { value: 'xh', label: 'Xhosa' },
    { value: 'nso', label: 'Northern Sotho' },
    { value: 'st', label: 'Southern Sotho' },
    { value: 'ss', label: 'Swazi' },
    { value: 'ts', label: 'Tsonga' },
    { value: 'tn', label: 'Tswana' },
    { value: 've', label: 'Venda' },
    { value: 'nr', label: 'Ndebele' },
] as const

export function Step1BusinessProfile({ onNext, initialData, isLoading = false, error }: Step1BusinessProfileProps) {
    const [newTopic, setNewTopic] = useState('')
    const [topics, setTopics] = useState<string[]>(initialData?.topics || ['Marketing']) // Add default topic

    const defaultValues = {
        topics: initialData?.topics || ['Marketing'], // Add default topic
        tone: initialData?.tone || 'professional',
        language: initialData?.language || 'en',
        ...initialData,
    }

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<Omit<CreateBusinessProfileInput, 'topics'> & { topics: string[] }>({
        resolver: zodResolver(createBusinessProfileSchema),
        defaultValues,
    })

    const addTopic = () => {
        if (newTopic.trim() && !topics.includes(newTopic.trim())) {
            const updatedTopics = [...topics, newTopic.trim()]
            setTopics(updatedTopics)
            setValue('topics', updatedTopics)
            setNewTopic('')
        }
    }

    const removeTopic = (index: number) => {
        const updatedTopics = topics.filter((_, i) => i !== index)
        setTopics(updatedTopics)
        setValue('topics', updatedTopics)
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSubmit((data) => {
            onNext(data)
        }, (errors) => {
            console.log('Validation failed with errors:', errors) // eslint-disable-line no-console
        })(e)
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Tell us about your business</h2>
                <p className="text-muted-foreground mt-2">
                    This information helps us create personalized content for your brand.
                </p>
            </div>

            <div className="space-y-4">
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Business Name *
                    </label>
                    <Input
                        id="name"
                        placeholder="e.g., Joe's Plumbing Services"
                        {...register('name')}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="industry" className="text-sm font-medium">
                        Industry *
                    </label>
                    <Input
                        id="industry"
                        placeholder="e.g., Plumbing, Retail, Consulting"
                        {...register('industry')}
                    />
                    {errors.industry && (
                        <p className="text-sm text-destructive">{errors.industry.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="targetAudience" className="text-sm font-medium">
                        Target Audience *
                    </label>
                    <Textarea
                        id="targetAudience"
                        placeholder="Describe your ideal customers (e.g., homeowners in suburban areas looking for reliable plumbing services)"
                        rows={3}
                        {...register('targetAudience')}
                    />
                    {errors.targetAudience && (
                        <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content Tone *</label>
                        <Controller
                            name="tone"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TONE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.tone && (
                            <p className="text-sm text-destructive">{errors.tone.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Primary Language *</label>
                        <Controller
                            name="language"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.language && (
                            <p className="text-sm text-destructive">{errors.language.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Content Topics *</label>
                    <p className="text-xs text-muted-foreground">
                        Add topics you want to create content about (e.g., tips, services, industry news)
                    </p>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a topic"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        />
                        <Button type="button" onClick={addTopic} size="sm" aria-label="Add topic">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {topics.map((topic, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                            >
                                {topic}
                                <button
                                    type="button"
                                    onClick={() => removeTopic(index)}
                                    className="hover:text-destructive"
                                    aria-label={`Remove ${topic} topic`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {errors.topics && (
                        <p className="text-sm text-destructive">{errors.topics.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="logoUrl" className="text-sm font-medium">
                        Logo URL (Optional)
                    </label>
                    <Input
                        id="logoUrl"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        {...register('logoUrl')}
                    />
                    {errors.logoUrl && (
                        <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
                    )}
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Profile...' : 'Continue to Social Media Setup'}
            </Button>
        </form>
    )
}