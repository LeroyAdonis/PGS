import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}))

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const message = {
      id: '1',
      message: 'Hello!',
      sender: 'user' as const,
      timestamp: new Date(),
    }

    render(<ChatMessage {...message} />)

    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(screen.getByText('Hello!')).toHaveClass('bg-purple-600')
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument()
  })

  it('renders system message correctly', () => {
    const message = {
      id: '2',
      message: 'How can I help you?',
      sender: 'system' as const,
      timestamp: new Date(),
    }

    render(<ChatMessage {...message} />)

    expect(screen.getByText('How can I help you?')).toBeInTheDocument()
    expect(screen.getByText('How can I help you?')).toHaveClass('bg-gray-100')
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument()
  })
})

describe('ChatInput', () => {
  it('renders input field and button', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} />)

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onSendMessage when send button is clicked', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test message' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnSend).toHaveBeenCalledWith('Test message')
  })

  it('calls onSendMessage when Enter key is pressed', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    expect(mockOnSend).toHaveBeenCalledWith('Test message')
  })

  it('does not call onSendMessage for empty message', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('clears input after sending message', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} />)

    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Test message' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(input.value).toBe('')
  })

  it('disables input when disabled prop is true', () => {
    const mockOnSend = jest.fn()
    render(<ChatInput onSendMessage={mockOnSend} disabled />)

    const input = screen.getByPlaceholderText('Type your message...')
    const button = screen.getByRole('button')

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })
})

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders chat widget button when closed', () => {
    render(<ChatWidget />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  it('opens chat widget when button is clicked', () => {
    render(<ChatWidget />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })

  it('renders with initial system message', () => {
    render(<ChatWidget isOpen />)

    expect(
      screen.getByText(
        "Hi! I'm your AI assistant. How can I help you with your social media content today?"
      )
    ).toBeInTheDocument()
  })

  it('closes chat widget when close button is clicked', () => {
    render(<ChatWidget isOpen />)

    expect(screen.getByText('AI Assistant')).toBeInTheDocument()

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find((btn) => btn.querySelector('svg'))
    
    if (closeButton) {
      fireEvent.click(closeButton)
    }

    // After closing, we should only see the floating button
    waitFor(() => {
      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
    })
  })

  it('sends user message and displays it', async () => {
    render(<ChatWidget isOpen />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Hello assistant' } })

    const buttons = screen.getAllByRole('button')
    const sendButton = buttons[buttons.length - 1]
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Hello assistant')).toBeInTheDocument()
    })
  })

  it('displays loading state while waiting for response', async () => {
    render(<ChatWidget isOpen />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test' } })

    const buttons = screen.getAllByRole('button')
    const sendButton = buttons[buttons.length - 1]
    fireEvent.click(sendButton)

    // Input should be disabled while loading
    await waitFor(() => {
      expect(input).toBeDisabled()
    })
  })

  it('displays system response after user message', async () => {
    render(<ChatWidget isOpen />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Help me' } })

    const buttons = screen.getAllByRole('button')
    const sendButton = buttons[buttons.length - 1]
    fireEvent.click(sendButton)

    // Fast-forward time to trigger the setTimeout
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(
        screen.getByText(
          'I understand you want help with social media content. What specific task would you like assistance with?'
        )
      ).toBeInTheDocument()
    })
  })
})
