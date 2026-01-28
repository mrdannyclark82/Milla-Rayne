import { Router, type Express } from 'express';
import { agentController } from '../agentController';
import { circuitBreaker } from '../apiResilience';
import { getSCPAQueueStatus } from '../metacognitiveService';
import { 
  getSchedulerStatus, 
  forceMemorySummarization 
} from '../memorySummarizationScheduler';
import { 
  getServerEvolutionStatus, 
  triggerServerEvolution, 
  getServerEvolutionHistory 
} from '../selfEvolutionService';
import { getMillaMoodData } from '../moodService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Monitoring and System Routes
 */
export function registerSystemRoutes(app: Express) {
  const router = Router();

  // Combined system health
  router.get('/monitoring/health', asyncHandler(async (req, res) => {
    const agentMetrics = agentController.getAllMetrics();
    const cbStatus = circuitBreaker.getStatus();
    const scpaStatus = getSCPAQueueStatus();
    const schedulerStatus = getSchedulerStatus();

    const openCircuits = Object.values(cbStatus).filter((s: any) => s.state === 'OPEN').length;
    const criticalFailures = scpaStatus.criticalFailures;
    const agentFailures = Object.values(agentMetrics).reduce((sum: number, m: any) => sum + (m.failureCount || 0), 0);

    let health = 'healthy';
    if (criticalFailures > 3 || openCircuits > 2) {
      health = 'critical';
    } else if (criticalFailures > 0 || openCircuits > 0 || agentFailures > 5) {
      health = 'degraded';
    }

    res.json({
      success: true,
      health,
      components: {
        agents: { total: agentController.getRegisteredAgents().length, failures: agentFailures },
        circuitBreakers: { total: Object.keys(cbStatus).length, open: openCircuits },
        scpa: { queueSize: scpaStatus.queueSize, critical: criticalFailures },
        scheduler: { running: schedulerStatus.isRunning, successRate: schedulerStatus.successRate },
      },
      timestamp: Date.now(),
    });
  }));

  // Memory scheduler monitoring
  router.get('/monitoring/memory-scheduler', asyncHandler(async (req, res) => {
    const status = getSchedulerStatus();
    res.json({ success: true, ...status, timestamp: Date.now() });
  }));

  router.post('/monitoring/memory-scheduler/force-run', asyncHandler(async (req, res) => {
    await forceMemorySummarization();
    res.json({ success: true, message: 'Memory summarization triggered', timestamp: Date.now() });
  }));

  // SCPA queue status
  router.get('/monitoring/scpa', asyncHandler(async (req, res) => {
    const status = getSCPAQueueStatus();
    res.json({ success: true, ...status, timestamp: Date.now() });
  }));

  // Milla's mood
  router.get('/milla-mood', asyncHandler(async (req, res) => {
    const moodData = await getMillaMoodData();
    res.json({ mood: moodData, success: true });
  }));

  // Self-Improvement / Evolution
  router.get('/self-improvement/status', asyncHandler(async (req, res) => {
    const serverStatus = getServerEvolutionStatus();
    res.json({ server: serverStatus, success: true });
  }));

  router.post('/self-improvement/trigger', asyncHandler(async (req, res) => {
    const serverEvolutions = await triggerServerEvolution();
    res.json({ serverEvolutions, message: 'Self-improvement cycle initiated successfully', success: true });
  }));

  router.get('/self-improvement/history', asyncHandler(async (req, res) => {
    const serverHistory = await getServerEvolutionHistory();
    const { type } = req.query;

    let filteredHistory = serverHistory;
    if (type && type !== 'all') {
      filteredHistory = serverHistory.filter((h: any) => h.evolutionType === type);
    }

    res.json({ serverHistory: filteredHistory, success: true });
  }));

  // Mount routes
  app.use('/api', router);
}
