'use client'

import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface ChatInputProps {
    onSendMessage: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
    const [inputMessage, setInputMessage] = useState('')

    const handleSend = () => {
        if (!inputMessage.trim()) return
        onSendMessage(inputMessage)
        setInputMessage('')
    }

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t p-3">
            <div className="flex space-x-2">
                <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={disabled}
                    className="flex-1 text-sm"
                />
                <Button
                    onClick={handleSend}
                    disabled={disabled || !inputMessage.trim()}
                    size="sm"
                    className="px-3"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
