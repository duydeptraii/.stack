/**
 * GET /api/health
 * 
 * Health check endpoint that returns API status and available models.
 */

import { isAnthropicConfigured } from '@/lib/ai/anthropic';
import { isOpenAIConfigured } from '@/lib/ai/openai';
import type { HealthCheckResponse } from '@/types/api';

export async function GET() {
  const claudeAvailable = isAnthropicConfigured();
  const openaiAvailable = isOpenAIConfigured();

  // Determine overall health status
  let status: HealthCheckResponse['status'] = 'healthy';
  if (!claudeAvailable && !openaiAvailable) {
    status = 'unhealthy';
  } else if (!claudeAvailable || !openaiAvailable) {
    status = 'degraded';
  }

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    models: {
      claude: claudeAvailable,
      openai: openaiAvailable,
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  // Return appropriate status code based on health
  const statusCode = status === 'unhealthy' ? 503 : 200;

  return Response.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
