/**
 * API Response Formatter
 * 
 * Standardized response formatting for API routes
 */

import { NextResponse } from "next/server";

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface CreatedResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

export interface DeletedResponse {
  success: true;
  message: string;
  timestamp: string;
}

// ============================================================================
// RESPONSE FORMATTERS
// ============================================================================

export function successResponse<T>(data: T, statusCode: number = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

export function createdResponse<T>(
  data: T,
  message: string = "Resource created successfully"
): NextResponse<CreatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export function deletedResponse(
  message: string = "Resource deleted successfully"
): NextResponse<DeletedResponse> {
  return NextResponse.json(
    {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export interface PaginationOptions {
  total: number;
  page: number;
  pageSize: number;
}

export function paginatedResponse<T>(
  data: T[],
  options: PaginationOptions
): NextResponse<PaginatedResponse<T>> {
  const { total, page, pageSize } = options;
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page: number; limit: number } = { page: 1, limit: 10 }
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.get("page") || String(defaults.page), 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") || String(defaults.limit), 10))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function redirectResponse(url: string, permanent: boolean = false): NextResponse {
  return NextResponse.redirect(url, permanent ? 301 : 302);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === true &&
    "data" in response
  );
}

export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return (
    isSuccessResponse(response) &&
    "pagination" in response &&
    typeof response.pagination === "object"
  );
}
