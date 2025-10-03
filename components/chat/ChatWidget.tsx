'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, X } from 'lucide-react'

interface ChatMessage {
    id: string
    message: string
    sender: 'user' | 'system'
    timestamp: Date
}

interface ChatWidgetProps {
    isOpen?: boolean
}

export function ChatWidget({ isOpen = false }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            message: 'Hi! I\'m your AI assistant. How can I help you with your social media content today?',
            sender: 'system',
            timestamp: new Date(),
        },
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showChat, setShowChat] = useState(isOpen)

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            message: inputMessage,
            sender: 'user',
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setIsLoading(true)

        try {
            // Here you would integrate with CopilotKit or your chat API
            // For now, we'll simulate a response
            setTimeout(() => {
                const systemMessage: ChatMessage = {
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
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
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'user'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
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
                    <div className="border-t p-3">
                        <div className="flex space-x-2">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="flex-1 text-sm"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputMessage.trim()}
                                size="sm"
                                className="px-3"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}