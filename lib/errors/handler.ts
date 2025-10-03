import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, ValidationError, ProblemDetails } from './types'
import { logger } from '../logging/logger'

/**
 * Global error handler for API routes
 * Converts errors to RFC 7807 Problem Details format
 */
export function handleError(error: unknown, instance?: string): NextResponse<ProblemDetails> {
  // Log the error
  logger.error('Error occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    instance,
  })

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    error.errors.forEach((err) => {
      const path = err.path.join('.')
      if (!errors[path]) {
        errors[path] = []
      }
      errors[path].push(err.message)
    })

    const validationError = new ValidationError('Validation failed', errors)
    return NextResponse.json(validationError.toProblemDetails(instance), {
      status: validationError.statusCode,
    })
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    const problemDetails = error.toProblemDetails(instance)

    // Hide internal error details from clients in production
    if (error.statusCode === 500 && process.env.NODE_ENV === 'production') {
      problemDetails.detail = 'An unexpected error occurred'
    }

    return NextResponse.json(problemDetails, { status: error.statusCode })
  }

  // Handle unknown errors
  const problemDetails: ProblemDetails = {
    type: '/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error instanceof Error
          ? error.message
          : String(error),
    instance,
  }

  return NextResponse.json(problemDetails, { status: 500 })
}

/**
 * Create a type-safe error response
 */
export function errorResponse(error: AppError, instance?: string): NextResponse<ProblemDetails> {
  return NextResponse.json(error.toProblemDetails(instance), { status: error.statusCode })
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}
