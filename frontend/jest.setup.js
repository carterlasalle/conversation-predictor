// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
})

// Mock ResizeObserver
class ResizeObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock WebSocket
class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
  }

  addEventListener = jest.fn()
  removeEventListener = jest.fn()
  send = jest.fn()
  close = jest.fn()

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
}

Object.defineProperty(window, 'WebSocket', {
  writable: true,
  configurable: true,
  value: WebSocket,
})

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0)
global.cancelAnimationFrame = jest.fn()

// Mock D3
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        join: jest.fn(() => ({
          attr: jest.fn(() => ({
            attr: jest.fn(() => ({
              attr: jest.fn(() => ({
                on: jest.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
    append: jest.fn(() => ({
      attr: jest.fn(() => ({
        attr: jest.fn(),
      })),
    })),
  })),
})) 