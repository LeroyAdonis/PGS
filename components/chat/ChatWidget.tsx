'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, X } from 'lucide-react'
import { ChatMessage as ChatMessageComponent, type ChatMessageProps } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface ChatWidgetProps {
    isOpen?: boolean
}

export function ChatWidget({ isOpen = false }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessageProps[]>([
        {
            id: '1',
            message: 'Hi! I\'m your AI assistant. How can I help you with your social media content today?',
            sender: 'system',
            timestamp: new Date(),
        },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [showChat, setShowChat] = useState(isOpen)

    const handleSendMessage = async (message: string) => {
        const userMessage: ChatMessageProps = {
            id: Date.now().toString(),
            message,
            sender: 'user',
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            // Here you would integrate with CopilotKit or your chat API
            // For now, we'll simulate a response
            setTimeout(() => {
                const systemMessage: ChatMessageProps = {
                    id: (Date.now() + 1).toString(),
                    message: 'I understand you want help with social media content. What specific task would you like assistance with?',
                    sender: 'system',
                    timestamp: new Date(),
                }
                setMessages(prev => [...prev, systemMessage])
                setIsLoading(false)
            }, 1000)
        } catch (error) {
            console.error('Failed to send message:', error)
            setIsLoading(false)
        }
    }

    if (!showChat) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => setShowChat(true)}
                    className="rounded-full w-12 h-12 p-0 bg-purple-600 hover:bg-purple-700"
                >
                    <MessageCircle className="w-6 h-6" />
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 h-96 flex flex-col shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChat(false)}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                            <ChatMessageComponent key={msg.id} {...msg} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
                </CardContent>
            </Card>
        </div>
    )
}