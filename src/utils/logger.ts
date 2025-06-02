type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
  userId?: string
  sessionId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private sessionId = this.generateSessionId()

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      sessionId: this.sessionId,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true
    }

    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`
    return `${prefix} - ${entry.message}`
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) {
      return
    }

    const entry = this.createLogEntry('debug', message, data)
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage(entry), data)
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) {
      return
    }

    const entry = this.createLogEntry('info', message, data)
    // eslint-disable-next-line no-console
    console.info(this.formatMessage(entry), data)
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) {
      return
    }

    const entry = this.createLogEntry('warn', message, data)
    console.warn(this.formatMessage(entry), data)

    // In production, you might want to send to external service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry)
    }
  }

  error(message: string, error?: Error, data?: unknown): void {
    if (!this.shouldLog('error')) {
      return
    }

    const entry = this.createLogEntry('error', message, { error: error?.stack, ...data })
    console.error(this.formatMessage(entry), error, data)

    // In production, you might want to send to external service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry)
    }
  }

  // Game-specific logging methods
  gameEvent(event: string, data?: unknown): void {
    this.info(`Game Event: ${event}`, data)
  }

  performanceMetric(metric: string, value: number, unit?: string): void {
    this.info(`Performance: ${metric}`, { value, unit })
  }

  userAction(action: string, data?: unknown): void {
    this.info(`User Action: ${action}`, data)
  }

  private sendToExternalService(_entry: LogEntry): void {
    // Implement external logging service integration
    // Example: Sentry, LogRocket, etc.
    try {
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }
}

export const logger = new Logger()
export default logger
