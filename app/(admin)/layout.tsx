import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/admin/users"
            className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            User Management
          </Link>
          <Link
            href="/admin/metrics"
            className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Platform Metrics
          </Link>
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            ← Back to Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
