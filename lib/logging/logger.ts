/**
 * Structured logging utility for Purple Glow Social
 * Provides contextual logging with levels: debug, info, warn, error
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  [key: string]: unknown
}

class Logger {
  private readonly serviceName: string = 'purple-glow-social'
  private readonly environment: string = process.env.NODE_ENV || 'development'

  /**
   * Format log entry with timestamp and context
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    }

    return JSON.stringify(logEntry)
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.environment === 'development') {
      // eslint-disable-next-line no-console
      console.debug(this.formatLog('debug', message, context))
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.info(this.formatLog('info', message, context))
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatLog('warn', message, context))
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.error(this.formatLog('error', message, context))
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info('HTTP Request', {
      method,
      path,
      ...context,
    })
  }

  /**
   * Log HTTP response
   */
  logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this[level]('HTTP Response', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    })
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger()
