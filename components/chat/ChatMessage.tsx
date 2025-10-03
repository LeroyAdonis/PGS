'use client'

import { formatDistanceToNow } from 'date-fns'

export interface ChatMessageProps {
    id: string
    message: string
    sender: 'user' | 'system'
    timestamp: Date
}

export function ChatMessage({ message, sender, timestamp }: ChatMessageProps) {
    return (
        <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex flex-col max-w-[80%]">
                <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                        sender === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                    }`}
                >
                    {message}
                </div>
                <span className="text-xs text-gray-500 mt-1 px-1">
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
            </div>
        </div>
    )
}
