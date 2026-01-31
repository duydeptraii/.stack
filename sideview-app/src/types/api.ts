/**
 * API request/response type definitions
 */

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  models: {
    claude: boolean;
    openai: boolean;
  };
  version: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
}
