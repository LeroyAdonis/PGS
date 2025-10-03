/**
 * Custom error classes for Purple Glow Social
 * Following RFC 7807 Problem Details for HTTP APIs standard
 */

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  [key: string]: unknown
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly type: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    type: string = 'about:blank',
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.type = type
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.constructor.name,
      status: this.statusCode,
      detail: this.message,
      instance,
    }
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>

  constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, 400, '/errors/validation')
    this.name = 'ValidationError'
    this.errors = errors
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      ...super.toProblemDetails(instance),
      errors: this.errors,
    }
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, '/errors/unauthorized')
    this.name = 'UnauthorizedError'
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, '/errors/forbidden')
    this.name = 'ForbiddenError'
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(message, 404, '/errors/not-found')
    this.name = 'NotFoundError'
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, '/errors/conflict')
    this.name = 'ConflictError'
  }
}

/**
 * 422 Unprocessable Entity - Valid syntax but semantic errors
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Cannot process request') {
    super(message, 422, '/errors/unprocessable-entity')
    this.name = 'UnprocessableEntityError'
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 429, '/errors/rate-limit')
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      ...super.toProblemDetails(instance),
      retryAfter: this.retryAfter,
    }
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred', isOperational: boolean = false) {
    super(message, 500, '/errors/internal-server-error', isOperational)
    this.name = 'InternalServerError'
  }
}

/**
 * 502 Bad Gateway - External service error
 */
export class BadGatewayError extends AppError {
  public readonly service: string

  constructor(service: string, message?: string) {
    super(message || `External service '${service}' is unavailable`, 502, '/errors/bad-gateway')
    this.name = 'BadGatewayError'
    this.service = service
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      ...super.toProblemDetails(instance),
      service: this.service,
    }
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, '/errors/service-unavailable')
    this.name = 'ServiceUnavailableError'
  }
}
