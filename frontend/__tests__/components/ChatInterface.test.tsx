import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInterface from '@/components/ChatInterface'
import { useWebSocket, useWebSocketEvent } from '@/lib/websocket'

// Mock the websocket hooks
jest.mock('@/lib/websocket', () => ({
  useWebSocket: jest.fn(),
  useWebSocketEvent: jest.fn(),
}))

describe('ChatInterface', () => {
  const mockSendMessage = jest.fn()

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock useWebSocket implementation
    ;(useWebSocket as jest.Mock).mockReturnValue({
      isConnected: true,
      sendMessage: mockSendMessage,
    })

    // Mock useWebSocketEvent implementation
    ;(useWebSocketEvent as jest.Mock).mockImplementation((event, callback) => {
      // Store the callback for manual triggering in tests
      if (event === 'message') {
        ;(useWebSocketEvent as any).messageCallback = callback
      } else if (event === 'error') {
        ;(useWebSocketEvent as any).errorCallback = callback
      }
    })
  })

  it('renders the chat interface', () => {
    render(<ChatInterface />)
    
    // Check for main elements
    expect(screen.getByText('Annie')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('handles message input and sending', async () => {
    render(<ChatInterface />)
    
    // Get input field and send button
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    // Type a message
    fireEvent.change(input, { target: { value: 'Hello, world!' } })
    expect(input).toHaveValue('Hello, world!')

    // Send the message
    fireEvent.click(sendButton)

    // Check if sendMessage was called
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Hello, world!')
    })

    // Check if input was cleared
    expect(input).toHaveValue('')
  })

  it('shows loading state while sending message', async () => {
    render(<ChatInterface />)
    
    // Type and send a message
    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // Check for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('handles received messages', () => {
    render(<ChatInterface />)
    
    // Simulate receiving a message
    const mockMessage = {
      id: '123',
      text: 'Hello from assistant',
      sender: 'assistant',
      timestamp: new Date(),
    }
    ;(useWebSocketEvent as any).messageCallback(mockMessage)

    // Check if message is displayed
    expect(screen.getByText('Hello from assistant')).toBeInTheDocument()
  })

  it('handles disconnected state', () => {
    ;(useWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      sendMessage: mockSendMessage,
    })

    render(<ChatInterface />)
    
    // Check for disconnected state
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Disconnected from server. Trying to reconnect...')).toBeInTheDocument()

    // Check if input is disabled
    expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled()
  })

  it('handles error states', async () => {
    render(<ChatInterface />)
    
    // Simulate an error
    const errorMessage = 'Failed to send message'
    ;(useWebSocketEvent as any).errorCallback({ message: errorMessage })

    // Check if error message is displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('handles message sending with Enter key', async () => {
    render(<ChatInterface />)
    
    // Get input field
    const input = screen.getByPlaceholderText('Type your message...')

    // Type a message and press Enter
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })

    // Check if sendMessage was called
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Hello')
    })
  })

  it('prevents sending empty messages', () => {
    render(<ChatInterface />)
    
    // Try to send empty message
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // Check that sendMessage was not called
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('toggles video call state', () => {
    render(<ChatInterface />)
    
    // Get video call button
    const videoButton = screen.getByRole('button', { name: /video/i })

    // Toggle video call
    fireEvent.click(videoButton)

    // Check if button state changed
    expect(videoButton).toHaveClass('bg-primary-100')

    // Toggle again
    fireEvent.click(videoButton)

    // Check if button state changed back
    expect(videoButton).not.toHaveClass('bg-primary-100')
  })
}) 