import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WebSocketProvider } from '@/contexts/WebSocketContext'


// Mock WebSocket for all tests
class MockWebSocket {
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onerror: ((error: any) => void) | null = null
  readyState: number = WebSocket.CONNECTING

  constructor(url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.()
    }, 0)
  }

  send(data: string) {
    // Mock send implementation
    const message = JSON.parse(data)
    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: 'mock_response',
          data: message,
        }),
      })
    }, 0)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    this.onclose?.()
  }
}

// Replace the real WebSocket with our mock
global.WebSocket = MockWebSocket as any

function render(
  ui: React.ReactElement,
  {
    wsUrl = 'ws://localhost:8001',
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WebSocketProvider url={wsUrl}>
        {children}
      </WebSocketProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  }
}

// Helper to create a mock WebSocket message
function createWSMessage(type: string, data: any) {
  return {
    data: JSON.stringify({ type, data }),
  }
}

// Helper to simulate WebSocket connection state
function simulateWSConnection(ws: MockWebSocket, connected: boolean) {
  if (connected) {
    ws.readyState = WebSocket.OPEN
    ws.onopen?.()
  } else {
    ws.readyState = WebSocket.CLOSED
    ws.onclose?.()
  }
}

// Helper to wait for WebSocket connection
function waitForWSConnection(ws: MockWebSocket) {
  return new Promise<void>((resolve) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve()
    } else {
      ws.onopen = () => resolve()
    }
  })
}

// Re-export everything
export * from '@testing-library/react'
export { render, createWSMessage, simulateWSConnection, waitForWSConnection } 