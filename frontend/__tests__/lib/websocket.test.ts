import { renderHook, act } from '@testing-library/react'
import { useWebSocket, useWebSocketEvent } from '@/lib/websocket'

describe('WebSocket Hooks', () => {
  let mockSocket: any

  beforeEach(() => {
    mockSocket = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.CONNECTING,
    }

    // Mock WebSocket constructor
    ;(global as any).WebSocket = jest.fn(() => mockSocket)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('useWebSocket', () => {
    it('initializes WebSocket connection', () => {
      const { result } = renderHook(() => useWebSocket())

      expect(WebSocket).toHaveBeenCalledWith(expect.stringContaining('ws://'))
      expect(result.current.isConnected).toBe(false)
    })

    it('handles successful connection', () => {
      const { result } = renderHook(() => useWebSocket())

      // Simulate connection success
      act(() => {
        const connectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'open'
        )[1]
        connectHandler()
      })

      expect(result.current.isConnected).toBe(true)
    })

    it('handles disconnection', () => {
      const { result } = renderHook(() => useWebSocket())

      // Simulate disconnection
      act(() => {
        const disconnectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'close'
        )[1]
        disconnectHandler()
      })

      expect(result.current.isConnected).toBe(false)
    })

    it('sends messages', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.sendMessage('test message')
      })

      expect(mockSocket.send).toHaveBeenCalledWith('test message')
    })
  })

  describe('useWebSocketEvent', () => {
    it('subscribes to WebSocket events', () => {
      const mockCallback = jest.fn()
      renderHook(() => useWebSocketEvent('message', mockCallback))

      // Find message event handler
      const messageHandler = mockSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]

      // Simulate message
      const mockData = { data: JSON.stringify({ type: 'test', data: 'message' }) }
      messageHandler(mockData)

      expect(mockCallback).toHaveBeenCalled()
    })

    it('unsubscribes from events on cleanup', () => {
      const mockCallback = jest.fn()
      const { unmount } = renderHook(() => useWebSocketEvent('message', mockCallback))

      unmount()

      expect(mockSocket.removeEventListener).toHaveBeenCalled()
    })

    it('handles JSON parse errors', () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      renderHook(() => useWebSocketEvent('message', mockCallback))

      // Find message event handler
      const messageHandler = mockSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]

      // Simulate invalid JSON message
      const mockData = { data: 'invalid json' }
      messageHandler(mockData)

      expect(consoleSpy).toHaveBeenCalled()
      expect(mockCallback).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
}) 