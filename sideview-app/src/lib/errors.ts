/**
 * Error handling utilities and custom error classes
 */

import type { ApiErrorResponse } from '@/types/api';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toResponse(): Response {
    const body: ApiErrorResponse = {
      error: this.message,
      code: this.code,
      details: this.details,
    };
    return Response.json(body, { status: this.statusCode });
  }
}

/**
 * Pre-defined error factories
 */
export const Errors = {
  /**
   * Bad request (400)
   */
  badRequest(message: string, details?: string): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  },

  /**
   * Unauthorized (401)
   */
  unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  },

  /**
   * Forbidden (403)
   */
  forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  },

  /**
   * Not found (404)
   */
  notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
  },

  /**
   * Rate limit exceeded (429)
   */
  rateLimitExceeded(retryAfter?: number): ApiError {
    const error = new ApiError(
      'Rate limit exceeded. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED',
      retryAfter ? `Retry after ${retryAfter} seconds` : undefined
    );
    return error;
  },

  /**
   * Internal server error (500)
   */
  internal(message: string = 'Internal server error', details?: string): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR', details);
  },

  /**
   * Service unavailable (503)
   */
  serviceUnavailable(service: string = 'Service'): ApiError {
    return new ApiError(`${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE');
  },

  /**
   * AI provider error
   */
  aiProviderError(provider: string, message: string): ApiError {
    return new ApiError(
      `AI provider error: ${message}`,
      502,
      'AI_PROVIDER_ERROR',
      `Provider: ${provider}`
    );
  },

  /**
   * Model not available
   */
  modelNotAvailable(model: string): ApiError {
    return new ApiError(
      `Model ${model} is not available`,
      400,
      'MODEL_NOT_AVAILABLE',
      'Please check if the API key for this model is configured'
    );
  },

  /**
   * Validation error
   */
  validation(message: string, details?: string): ApiError {
    return new ApiError(message, 400, 'VALIDATION_ERROR', details);
  },
};

/**
 * Handle unknown errors and convert to ApiError
 */
export function handleError(error: unknown): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error types
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return Errors.rateLimitExceeded();
    }

    // Authentication errors
    if (message.includes('api key') || message.includes('authentication') || message.includes('401')) {
      return Errors.unauthorized('Invalid or missing API key');
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new ApiError('Request timed out', 504, 'TIMEOUT');
    }

    // Default to internal error
    return Errors.internal(error.message);
  }

  // Unknown error type
  return Errors.internal('An unexpected error occurred');
}

/**
 * Create rate limit response with headers
 */
export function createRateLimitResponse(retryAfter: number): Response {
  const error = Errors.rateLimitExceeded(retryAfter);
  const response = error.toResponse();
  
  return new Response(response.body, {
    status: 429,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'Retry-After': String(retryAfter),
      'X-RateLimit-Remaining': '0',
    },
  });
}
