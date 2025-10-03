'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNav } from '@/components/dashboard/TopNav'
import { ChatWidget } from '@/components/chat/ChatWidget'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
                <TopNav onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>

            {/* Chat Widget */}
            <ChatWidget />
        </div>
    )
}