/**
 * Prometheus Metrics Service
 * Basic monitoring metrics
 */

import { Request, Response, NextFunction } from 'express';

// Simple in-memory metrics (use prom-client in production)
interface Metrics {
  httpRequests: Map<string, number>;
  httpErrors: Map<string, number>;
  responseTime: number[];
  activeConnections: number;
}

class MetricsService {
  private metrics: Metrics = {
    httpRequests: new Map(),
    httpErrors: new Map(),
    responseTime: [],
    activeConnections: 0,
  };

  /**
   * Increment HTTP request counter
   */
  incrementRequest(method: string, statusCode: number): void {
    const key = `${method}:${statusCode}`;
    this.metrics.httpRequests.set(key, (this.metrics.httpRequests.get(key) || 0) + 1);
  }

  /**
   * Increment HTTP error counter
   */
  incrementError(method: string, statusCode: number): void {
    const key = `${method}:${statusCode}`;
    this.metrics.httpErrors.set(key, (this.metrics.httpErrors.get(key) || 0) + 1);
  }

  /**
   * Record response time
   */
  recordResponseTime(ms: number): void {
    this.metrics.responseTime.push(ms);
    // Keep only last 1000 samples
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  /**
   * Increment active connections
   */
  incrementConnections(): void {
    this.metrics.activeConnections++;
  }

  /**
   * Decrement active connections
   */
  decrementConnections(): void {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  /**
   * Get all metrics
   */
  getMetrics(): any {
    return {
      http_requests: Object.fromEntries(this.metrics.httpRequests),
      http_errors: Object.fromEntries(this.metrics.httpErrors),
      response_time: {
        p50: this.percentile(this.metrics.responseTime, 50),
        p95: this.percentile(this.metrics.responseTime, 95),
        p99: this.percentile(this.metrics.responseTime, 99),
        avg: this.avg(this.metrics.responseTime),
      },
      active_connections: this.metrics.activeConnections,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate average
   */
  private avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Export in Prometheus format
   */
  exportPrometheus(): string {
    const metrics = this.getMetrics();
    let output = '# Prometheus Metrics\n\n';

    // HTTP Requests
    output += '# HELP http_requests_total Total HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, value] of Object.entries(metrics.http_requests)) {
      output += `http_requests_total{method="${key.split(':')[0]}",status="${key.split(':')[1]}"} ${value}\n`;
    }

    // HTTP Errors
    output += '\n# HELP http_errors_total Total HTTP errors\n';
    output += '# TYPE http_errors_total counter\n';
    for (const [key, value] of Object.entries(metrics.http_errors)) {
      output += `http_errors_total{method="${key.split(':')[0]}",status="${key.split(':')[1]}"} ${value}\n`;
    }

    // Response Time
    output += '\n# HELP http_response_time_seconds HTTP response time\n';
    output += '# TYPE http_response_time_seconds summary\n';
    output += `http_response_time_seconds{quantile="0.5"} ${(metrics.response_time.p50 / 1000).toFixed(3)}\n`;
    output += `http_response_time_seconds{quantile="0.95"} ${(metrics.response_time.p95 / 1000).toFixed(3)}\n`;
    output += `http_response_time_seconds{quantile="0.99"} ${(metrics.response_time.p99 / 1000).toFixed(3)}\n`;
    output += `http_response_time_seconds_sum ${(metrics.response_time.avg * metrics.response_time.p50 / 1000).toFixed(3)}\n`;

    // Active Connections
    output += '\n# HELP http_active_connections Active HTTP connections\n';
    output += '# TYPE http_active_connections gauge\n';
    output += `http_active_connections ${metrics.active_connections}\n`;

    return output;
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.metrics = {
      httpRequests: new Map(),
      httpErrors: new Map(),
      responseTime: [],
      activeConnections: 0,
    };
  }
}

export const metricsService = new MetricsService();

/**
 * Middleware to collect metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  metricsService.incrementConnections();

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metricsService.recordResponseTime(duration);
    
    if (res.statusCode >= 400) {
      metricsService.incrementError(req.method, res.statusCode);
    } else {
      metricsService.incrementRequest(req.method, res.statusCode);
    }
    
    metricsService.decrementConnections();
  });

  next();
};

/**
 * Metrics endpoint
 */
export const getMetrics = (req: Request, res: Response) => {
  const format = req.query.format;

  if (format === 'prometheus') {
    res.setHeader('Content-Type', 'text/plain');
    return res.send(metricsService.exportPrometheus());
  }

  res.json(metricsService.getMetrics());
};

