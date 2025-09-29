/**
 * Self-Improvement Tracker Component
 * 
 * Provides a comprehensive interface for viewing Milla's recursive self-improvement
 * history, analytics, and current status. Helps users understand what changes
 * have been made and their impact on performance.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Activity, BarChart3, History, Settings } from 'lucide-react';

interface SelfImprovementData {
  status: {
    client: any;
    server: any;
    success: boolean;
  };
  history: {
    client: any[];
    server: any[];
    total: { client: number; server: number };
    success: boolean;
  };
  analytics: {
    client: any;
    server: any;
    combined: any;
    success: boolean;
  };
}

export function SelfImprovementTracker() {
  const [data, setData] = useState<SelfImprovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    limit: '50'
  });

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statusRes, historyRes, analyticsRes] = await Promise.all([
        fetch('/api/self-improvement/status'),
        fetch(`/api/self-improvement/history?${new URLSearchParams(filters).toString()}`),
        fetch('/api/self-improvement/analytics')
      ]);

      const [status, history, analytics] = await Promise.all([
        statusRes.json(),
        historyRes.json(),
        analyticsRes.json()
      ]);

      setData({ status, history, analytics });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch improvement data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger new improvement cycle
  const triggerImprovement = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/self-improvement/trigger', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        // Refresh data after successful trigger
        await fetchData();
      } else {
        setError('Failed to trigger improvement cycle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger improvement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const formatPerformanceImpact = (impact: number | null) => {
    if (impact === null || impact === undefined) return 'N/A';
    const percentage = (impact * 100).toFixed(1);
    if (impact > 0.01) return <span className="text-green-600">+{percentage}%</span>;
    if (impact < -0.01) return <span className="text-red-600">{percentage}%</span>;
    return <span className="text-gray-500">~{percentage}%</span>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case true:
        return 'default';
      case 'analyzing':
      case 'implementing':
      case 'testing':
        return 'secondary';
      case 'rolled_back':
      case false:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading improvement data...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading improvement data: {error}</p>
            <Button onClick={fetchData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Self-Improvement Tracker</h2>
          <p className="text-muted-foreground">
            Monitor Milla's recursive self-improvement cycles and performance enhancements
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={triggerImprovement} disabled={loading}>
            <Activity className="w-4 h-4 mr-2" />
            Trigger Improvement
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Improvements</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(data?.analytics?.combined?.totalImprovements || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Client: {data?.status?.client?.totalCycles || 0} | 
                  Server: {data?.status?.server?.totalEvolutions || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((data?.analytics?.combined?.successRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all improvement attempts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Status</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant={data?.status?.client?.isCurrentlyImproving ? 'default' : 'secondary'}>
                    {data?.status?.client?.isCurrentlyImproving ? 'Active' : 'Idle'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next cycle: {data?.status?.client?.nextCycleDue ? 'Due now' : 'Scheduled'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
                {getTrendIcon(data?.analytics?.combined?.trends?.performanceImpact || 'stable')}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics?.combined?.trends?.performanceImpact || 'Stable'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall system performance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest improvement cycles and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.analytics?.client?.recentActivity?.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(activity.status)}>
                        {activity.status}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">Client Improvement #{activity.id.split('_')[1]}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{activity.changesCount} changes</div>
                      <div className="text-xs">
                        {formatPerformanceImpact(activity.performanceImpact)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {data?.analytics?.server?.recentActivity?.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(activity.success)}>
                        {activity.success ? 'completed' : 'failed'}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">Server Evolution - {activity.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{activity.description}</div>
                      <div className="text-xs">
                        {formatPerformanceImpact(activity.performanceImpact)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Improvement History</CardTitle>
              <CardDescription>Complete history of all improvement cycles</CardDescription>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="algorithm">Algorithm</SelectItem>
                    <SelectItem value="memory">Memory</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="implementing">Implementing</SelectItem>
                    <SelectItem value="rolled_back">Rolled Back</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-[150px]"
                />

                <Input
                  type="date"
                  placeholder="To date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-[150px]"
                />

                <Select value={filters.limit} onValueChange={(value) => setFilters({...filters, limit: value})}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Client History */}
                <div>
                  <h4 className="font-semibold mb-2">Client-Side Improvements</h4>
                  {data?.history?.client?.map((cycle: any) => (
                    <Card key={cycle.id} className="mb-2">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">Cycle #{cycle.cycleNumber}</h5>
                            <p className="text-sm text-muted-foreground">
                              {new Date(cycle.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(cycle.status)}>
                            {cycle.status}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <p><strong>Changes:</strong> {cycle.implementedChanges?.length || 0}</p>
                          {cycle.implementedChanges?.map((change: any, index: number) => (
                            <div key={index} className="ml-4 mt-1">
                              <Badge variant="outline" className="mr-2 text-xs">
                                {change.type}
                              </Badge>
                              {change.description}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Server History */}
                <div>
                  <h4 className="font-semibold mb-2">Server-Side Evolutions</h4>
                  {data?.history?.server?.map((evolution: any) => (
                    <Card key={evolution.id} className="mb-2">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{evolution.evolutionType} Evolution</h5>
                            <p className="text-sm text-muted-foreground">
                              {new Date(evolution.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(evolution.success)}>
                            {evolution.success ? 'successful' : 'failed'}
                          </Badge>
                        </div>
                        <p className="text-sm">{evolution.description}</p>
                        {evolution.performanceAfter && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Performance Impact: {formatPerformanceImpact(
                              ((evolution.performanceBefore.responseTime - evolution.performanceAfter.responseTime) / 
                                evolution.performanceBefore.responseTime)
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Client-Side Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Improvement Types</h4>
                    {Object.entries(data?.analytics?.client?.improvementsByType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Trends</h4>
                    <div className="flex items-center space-x-2">
                      <span>Frequency:</span>
                      {getTrendIcon(data?.analytics?.client?.trends?.frequency)}
                      <span className="capitalize">{data?.analytics?.client?.trends?.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span>Performance:</span>
                      {getTrendIcon(data?.analytics?.client?.trends?.performance)}
                      <span className="capitalize">{data?.analytics?.client?.trends?.performance}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Server-Side Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Evolution Types</h4>
                    {Object.entries(data?.analytics?.server?.evolutionsByType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Performance Impact</h4>
                    <div className="text-sm space-y-1">
                      <div>Response Time: {formatPerformanceImpact(data?.analytics?.server?.averagePerformanceImpact?.responseTime)}</div>
                      <div>Memory Usage: {formatPerformanceImpact(data?.analytics?.server?.averagePerformanceImpact?.memoryUsage)}</div>
                      <div>CPU Usage: {formatPerformanceImpact(data?.analytics?.server?.averagePerformanceImpact?.cpuUsage)}</div>
                      <div>Error Rate: {formatPerformanceImpact(data?.analytics?.server?.averagePerformanceImpact?.errorRate)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SelfImprovementTracker;