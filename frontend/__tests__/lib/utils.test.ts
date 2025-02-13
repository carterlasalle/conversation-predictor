import {
  cn,
  formatDate,
  formatScore,
  debounce,
  throttle,
  generateId,
  isWebSocketSupported,
  parseWSMessage,
  getConfig,
  isDevelopment,
  createRetryFn,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('base', 'extra')).toBe('base extra')
      expect(cn('base', { conditional: true })).toBe('base conditional')
      expect(cn('base', { conditional: false })).toBe('base')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-03-10T14:30:00')
      expect(formatDate(date)).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatScore', () => {
    it('formats score as percentage', () => {
      expect(formatScore(0.75)).toBe('75%')
      expect(formatScore(0.123)).toBe('12%')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('debounces function calls', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 1000)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      jest.runAllTimers()

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('throttles function calls', () => {
      const fn = jest.fn()
      const throttledFn = throttle(fn, 1000)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1000)
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('isWebSocketSupported', () => {
    it('checks WebSocket support', () => {
      expect(isWebSocketSupported()).toBe(true)

      const originalWebSocket = global.WebSocket
      delete (global as any).WebSocket
      expect(isWebSocketSupported()).toBe(false)
      global.WebSocket = originalWebSocket
    })
  })

  describe('parseWSMessage', () => {
    it('parses valid JSON message', () => {
      const message = { type: 'test', data: 'message' }
      expect(parseWSMessage(JSON.stringify(message))).toEqual(message)
    })

    it('handles invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      expect(parseWSMessage('invalid json')).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getConfig', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_WEBSOCKET_URL: 'ws://test',
        NEXT_PUBLIC_API_URL: 'http://test',
        NEXT_PUBLIC_ENV: 'test',
        NEXT_PUBLIC_ENABLE_VIDEO: 'true',
        NEXT_PUBLIC_ENABLE_VOICE: 'true',
        NEXT_PUBLIC_ANALYTICS_ID: 'test-id',
      }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns configuration from environment', () => {
      const config = getConfig()
      expect(config.wsUrl).toBe('ws://test')
      expect(config.apiUrl).toBe('http://test')
      expect(config.environment).toBe('test')
      expect(config.features.enableVideo).toBe(true)
      expect(config.features.enableVoice).toBe(true)
      expect(config.analytics.id).toBe('test-id')
    })
  })

  describe('isDevelopment', () => {
    const originalNodeEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv
    })

    it('returns true in development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    it('returns false in production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('createRetryFn', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('retries failed function calls', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')

      const retryFn = createRetryFn(fn, 3, 1000)

      const promise = retryFn()
      
      // Fast-forward timers after each rejection
      await jest.runAllTimersAsync()
      await jest.runAllTimersAsync()

      const result = await promise
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('throws after max retries', async () => {
      const error = new Error('fail')
      const fn = jest.fn().mockRejectedValue(error)
      const retryFn = createRetryFn(fn, 3, 1000)

      await expect(retryFn()).rejects.toThrow(error)
      expect(fn).toHaveBeenCalledTimes(4) // Initial try + 3 retries
    })
  })
}) 