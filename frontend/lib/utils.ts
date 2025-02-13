import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format a score as a percentage
 */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastResult: ReturnType<T>

  return function executedFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Check if WebSocket is supported
 */
export function isWebSocketSupported(): boolean {
  return 'WebSocket' in window || 'MozWebSocket' in window
}

/**
 * Parse WebSocket message data
 */
export function parseWSMessage(data: string): any {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
    return null
  }
}

/**
 * Get configuration from environment variables
 */
export function getConfig() {
  return {
    wsUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    environment: process.env.NEXT_PUBLIC_ENV,
    features: {
      enableVideo: process.env.NEXT_PUBLIC_ENABLE_VIDEO === 'true',
      enableVoice: process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true',
    },
    analytics: {
      id: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    },
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    ...context,
  })
}

/**
 * Create a retry function with exponential backoff
 */
export function createRetryFn<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): () => Promise<T> {
  return async function retry(attempt: number = 0): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retry(attempt + 1)
    }
  }
} 