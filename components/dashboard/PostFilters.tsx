'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'
type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected'

const platformOptions: { value: Platform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const statusOptions: { value: PostStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
]

export function PostFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') || ''
  const platform = searchParams.get('platform') || ''
  const fromDate = searchParams.get('fromDate') || ''
  const toDate = searchParams.get('toDate') || ''

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(window.location.pathname)
  }

  const hasActiveFilters = status || platform || fromDate || toDate

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => updateFilters({ status: value })}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform Filter */}
        <div className="space-y-2">
          <Label htmlFor="platform-filter">Platform</Label>
          <Select
            value={platform}
            onValueChange={(value) => updateFilters({ platform: value })}
          >
            <SelectTrigger id="platform-filter">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All platforms</SelectItem>
              {platformOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="from-date-filter">From Date</Label>
          <Input
            id="from-date-filter"
            type="date"
            value={fromDate}
            onChange={(e) => updateFilters({ fromDate: e.target.value })}
          />
        </div>

        {/* To Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="to-date-filter">To Date</Label>
          <Input
            id="to-date-filter"
            type="date"
            value={toDate}
            onChange={(e) => updateFilters({ toDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
