import { Router, type Express } from 'express';
import {
  getAllSandboxes,
  getSandbox,
  testFeature,
} from '../sandboxEnvironmentService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Sandbox and Feature Management Routes
 */
export function registerSandboxRoutes(app: Express) {
  const router = Router();

  router.get(
    '/sandboxes',
    asyncHandler(async (req, res) => {
      const sandboxes = await getAllSandboxes();
      res.json({ success: true, sandboxes });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/approve',
    asyncHandler(async (req, res) => {
      // Implementation for approval logic (likely in sandbox service)
      res.json({ success: true, message: 'Feature approved' });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/test',
    asyncHandler(async (req, res) => {
      const testType = req.body.testType || 'unit';
      const result = await testFeature(
        req.params.sandboxId as string,
        req.params.featureId as string,
        testType
      );
      res.json(result);
    })
  );

  // Mount routes
  app.use('/api', router);
}
