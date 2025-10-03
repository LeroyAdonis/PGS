'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'

interface User {
  id: string
  email: string
  display_name: string
  role: 'user' | 'admin'
  account_status: 'active' | 'suspended' | 'deleted'
  subscription_tier?: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')

  useEffect(() => {
    fetchUsers()
  }, [filterStatus, filterRole])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterRole) params.set('role', filterRole)
      if (searchEmail) params.set('email', searchEmail)

      const response = await fetch(`/api/v1/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspended by admin' }),
      })

      if (!response.ok) throw new Error('Failed to suspend user')

      toast({
        title: 'User Suspended',
        description: 'The user has been suspended successfully.',
      })

      fetchUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users and their accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchUsers}>Search</Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Email</th>
              <th className="p-3 text-left text-sm font-medium">Display Name</th>
              <th className="p-3 text-left text-sm font-medium">Role</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Tier</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-3 text-sm">{user.email}</td>
                  <td className="p-3 text-sm">{user.display_name}</td>
                  <td className="p-3 text-sm">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">
                    <Badge
                      variant={
                        user.account_status === 'active'
                          ? 'default'
                          : user.account_status === 'suspended'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {user.account_status}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">{user.subscription_tier || 'None'}</td>
                  <td className="p-3 text-sm">
                    {user.account_status === 'active' && user.role !== 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSuspend(user.id)}
                      >
                        Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
