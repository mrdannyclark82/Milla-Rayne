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
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res.status(400).json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res.status(400).json({ success: false, error: 'Invalid feature ID' });
      }
      // Implementation for approval logic (likely in sandbox service)
      res.json({ success: true, message: 'Feature approved' });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/test',
    asyncHandler(async (req, res) => {
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res.status(400).json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res.status(400).json({ success: false, error: 'Invalid feature ID' });
      }
      const inputTestType =
        req.body && typeof req.body.testType === 'string' ? req.body.testType : 'unit';
      const validTestTypes = new Set(['unit', 'integration', 'user_acceptance']);
      if (!validTestTypes.has(inputTestType)) {
        return res.status(400).json({ success: false, error: 'Invalid test type' });
      }

      const result = await testFeature(
        sandboxId,
        featureId,
        inputTestType as 'unit' | 'integration' | 'user_acceptance'
      );
      res.json(result);
    })
  );

  // Mount routes
  app.use('/api', router);
}
