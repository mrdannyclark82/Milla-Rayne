/**
 * Performance Profiling Service
 * 
 * Monitors and profiles system performance to identify optimization opportunities.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  operation: string;
  duration: number;
  memoryUsed: number;
  cpuUsage: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceProfile {
  operation: string;
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  successRate: number;
  averageMemory: number;
  averageCPU: number;
  lastProfiled: number;
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  operation: string;
  issue: string;
  recommendation: string;
  acknowledged: boolean;
}

class PerformanceProfilingService {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly METRICS_FILE = path.join(process.cwd(), 'memory', 'performance_metrics.json');
  private readonly MAX_METRICS_STORED = 10000;
  private readonly ALERT_THRESHOLDS = {
    slowOperation: 5000, // ms
    highMemory: 500 * 1024 * 1024, // 500MB
    highCPU: 0.8, // 80%
    lowSuccessRate: 0.9, // 90%
  };

  async initialize(): Promise<void> {
    await this.loadMetrics();
    console.log('Performance Profiling Service initialized');
  }

  /**
   * Record a performance metric
   */
  async recordMetric(params: {
    operation: string;
    duration: number;
    success: boolean;
    metadata?: Record<string, any>;
  }): Promise<PerformanceMetric> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation: params.operation,
      duration: params.duration,
      memoryUsed: memUsage.heapUsed,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      success: params.success,
      metadata: params.metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS_STORED) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_STORED);
    }

    // Check for performance issues
    await this.checkForPerformanceIssues(metric);

    // Save periodically (every 50 metrics)
    if (this.metrics.length % 50 === 0) {
      await this.saveMetrics();
    }

    return metric;
  }

  /**
   * Start profiling an operation
   */
  startProfiling(operation: string): { end: () => Promise<PerformanceMetric> } {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    return {
      end: async () => {
        const duration = Date.now() - startTime;
        const memoryUsed = process.memoryUsage().heapUsed - startMemory;

        return await this.recordMetric({
          operation,
          duration,
          success: true,
          metadata: { memoryDelta: memoryUsed },
        });
      },
    };
  }

  /**
   * Get performance profile for an operation
   */
  getPerformanceProfile(operation: string): PerformanceProfile | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = operationMetrics.filter(m => m.success).length;

    return {
      operation,
      totalCalls: operationMetrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      successRate: successCount / operationMetrics.length,
      averageMemory: operationMetrics.reduce((sum, m) => sum + m.memoryUsed, 0) / operationMetrics.length,
      averageCPU: operationMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / operationMetrics.length,
      lastProfiled: operationMetrics[operationMetrics.length - 1].timestamp,
    };
  }

  /**
   * Get all performance profiles
   */
  getAllPerformanceProfiles(): PerformanceProfile[] {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    return operations
      .map(op => this.getPerformanceProfile(op))
      .filter((p): p is PerformanceProfile => p !== null)
      .sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold: number = 3000): PerformanceProfile[] {
    return this.getAllPerformanceProfiles()
      .filter(p => p.averageDuration > threshold)
      .sort((a, b) => b.averageDuration - a.averageDuration);
  }

  /**
   * Get high memory operations
   */
  getHighMemoryOperations(): PerformanceProfile[] {
    return this.getAllPerformanceProfiles()
      .filter(p => p.averageMemory > this.ALERT_THRESHOLDS.highMemory)
      .sort((a, b) => b.averageMemory - a.averageMemory);
  }

  /**
   * Check for performance issues
   */
  private async checkForPerformanceIssues(metric: PerformanceMetric): Promise<void> {
    // Check for slow operations
    if (metric.duration > this.ALERT_THRESHOLDS.slowOperation) {
      await this.createAlert({
        severity: metric.duration > this.ALERT_THRESHOLDS.slowOperation * 2 ? 'critical' : 'high',
        operation: metric.operation,
        issue: `Operation took ${(metric.duration / 1000).toFixed(2)}s (threshold: ${(this.ALERT_THRESHOLDS.slowOperation / 1000).toFixed(2)}s)`,
        recommendation: 'Consider optimizing this operation or implementing caching',
      });
    }

    // Check for high memory usage
    if (metric.memoryUsed > this.ALERT_THRESHOLDS.highMemory) {
      await this.createAlert({
        severity: 'high',
        operation: metric.operation,
        issue: `High memory usage: ${(metric.memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        recommendation: 'Review memory allocation and consider implementing memory pooling',
      });
    }

    // Check for low success rate
    const profile = this.getPerformanceProfile(metric.operation);
    if (profile && profile.successRate < this.ALERT_THRESHOLDS.lowSuccessRate && profile.totalCalls > 10) {
      await this.createAlert({
        severity: 'medium',
        operation: metric.operation,
        issue: `Low success rate: ${(profile.successRate * 100).toFixed(1)}%`,
        recommendation: 'Investigate error patterns and improve error handling',
      });
    }
  }

  /**
   * Create a performance alert
   */
  private async createAlert(params: {
    severity: PerformanceAlert['severity'];
    operation: string;
    issue: string;
    recommendation: string;
  }): Promise<PerformanceAlert> {
    // Check if similar alert exists recently (within 1 hour)
    const recentSimilar = this.alerts.find(a => 
      a.operation === params.operation && 
      a.issue === params.issue &&
      Date.now() - a.timestamp < 60 * 60 * 1000
    );

    if (recentSimilar) {
      return recentSimilar;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity: params.severity,
      operation: params.operation,
      issue: params.issue,
      recommendation: params.recommendation,
      acknowledged: false,
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    await this.saveMetrics();
    console.log(`⚠️  Performance alert: ${params.operation} - ${params.issue}`);

    return alert;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.saveMetrics();
      return true;
    }
    return false;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics() {
    const profiles = this.getAllPerformanceProfiles();
    const slowOps = this.getSlowOperations();
    const alerts = this.getUnacknowledgedAlerts();

    return {
      totalOperations: profiles.reduce((sum, p) => sum + p.totalCalls, 0),
      uniqueOperations: profiles.length,
      averageResponseTime: profiles.reduce((sum, p) => sum + p.averageDuration, 0) / profiles.length || 0,
      slowOperations: slowOps.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      highAlerts: alerts.filter(a => a.severity === 'high').length,
      topSlowOperations: slowOps.slice(0, 5).map(p => ({
        operation: p.operation,
        duration: p.averageDuration,
      })),
      recentMetrics: this.metrics.slice(-100).length,
    };
  }

  /**
   * Load metrics from file
   */
  private async loadMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.METRICS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.metrics = parsed.metrics || [];
      this.alerts = parsed.alerts || [];
    } catch (error) {
      console.log('No existing metrics found, starting fresh');
    }
  }

  /**
   * Save metrics to file
   */
  private async saveMetrics(): Promise<void> {
    try {
      const data = {
        metrics: this.metrics,
        alerts: this.alerts,
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.METRICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }
}

// Singleton instance
const profilingService = new PerformanceProfilingService();

export async function initializePerformanceProfiling(): Promise<void> {
  await profilingService.initialize();
}

export function recordPerformanceMetric(params: {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}): Promise<PerformanceMetric> {
  return profilingService.recordMetric(params);
}

export function startProfiling(operation: string) {
  return profilingService.startProfiling(operation);
}

export function getPerformanceProfile(operation: string): PerformanceProfile | null {
  return profilingService.getPerformanceProfile(operation);
}

export function getAllPerformanceProfiles(): PerformanceProfile[] {
  return profilingService.getAllPerformanceProfiles();
}

export function getSlowOperations(threshold?: number): PerformanceProfile[] {
  return profilingService.getSlowOperations(threshold);
}

export function getHighMemoryOperations(): PerformanceProfile[] {
  return profilingService.getHighMemoryOperations();
}

export function getAllPerformanceAlerts(): PerformanceAlert[] {
  return profilingService.getAllAlerts();
}

export function getUnacknowledgedPerformanceAlerts(): PerformanceAlert[] {
  return profilingService.getUnacknowledgedAlerts();
}

export function acknowledgePerformanceAlert(alertId: string): Promise<boolean> {
  return profilingService.acknowledgeAlert(alertId);
}

export function getPerformanceStatistics() {
  return profilingService.getPerformanceStatistics();
}
