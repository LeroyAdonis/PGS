/**
 * API Error Handler
 * 
 * Standardized error classes and error handling utilities for API routes
 */

import { ZodError } from "zod";
import { NextResponse } from "next/server";

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTH_ERROR");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "You don't have permission to access this resource") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", public retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { retryAfter });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `External service error: ${service}`, 502, "EXTERNAL_SERVICE_ERROR", {
      service,
    });
  }
}

// ============================================================================
// ERROR RESPONSE FORMATTER
// ============================================================================

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: unknown;
    timestamp: string;
  };
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
        timestamp,
      },
    };
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp,
      },
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      error: {
        message: error.message,
        code: "INTERNAL_ERROR",
        statusCode: 500,
        timestamp,
      },
    };
  }

  // Handle unknown errors
  return {
    error: {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      timestamp,
    },
  };
}

// ============================================================================
// ERROR HANDLER FOR API ROUTES
// ============================================================================

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  const errorResponse = formatErrorResponse(error);

  // Log error for debugging (in production, send to error tracking service)
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", {
      error: error instanceof Error ? error : new Error(String(error)),
      response: errorResponse,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  return NextResponse.json(errorResponse, {
    status: errorResponse.error.statusCode,
  });
}

// ============================================================================
// ERROR LOGGER (for server-side logging)
// ============================================================================

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === "development") {
    console.error(`[${timestamp}] Error:`, {
      error: error instanceof Error ? error : new Error(String(error)),
      context,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // TODO: Integrate with error tracking service
    console.error(`[${timestamp}] Error:`, {
      message: error instanceof Error ? error.message : String(error),
      context,
    });
  }
}

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError;
}

export function isCriticalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.statusCode >= 500;
  }
  return true;
}
