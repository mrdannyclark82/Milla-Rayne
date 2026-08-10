import { Router, type Express } from 'express';
import {
  getAllSandboxes,
  getSandbox,
  testFeature,
  approveFeature,
  rejectFeature,
  getFeatureDetail,
} from '../sandboxEnvironmentService';
import { asyncHandler } from '../utils/routeHelpers';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Sandbox and Feature Management Routes
 */
export function registerSandboxRoutes(app: Express) {
  const router = Router();

  router.get(
    '/sandboxes',
    asyncHandler(async (_req, res) => {
      // Prefer disk-fresh snapshot so UI refresh matches approve/test/reject
      try {
        const file = path.join(
          process.cwd(),
          'memory',
          'sandbox_environments.json'
        );
        const raw = await fs.readFile(file, 'utf-8');
        const parsed = JSON.parse(raw);
        const sandboxes = Object.values(parsed.sandboxes || {});
        res.json({ success: true, sandboxes });
        return;
      } catch {
        // fall through to in-memory
      }
      const sandboxes = getAllSandboxes();
      res.json({ success: true, sandboxes });
    })
  );

  router.get(
    '/sandboxes/:sandboxId',
    asyncHandler(async (req, res) => {
      const { sandboxId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid sandbox ID' });
      }
      const sandbox = getSandbox(sandboxId);
      if (!sandbox) {
        return res
          .status(404)
          .json({ success: false, error: 'Sandbox not found' });
      }
      res.json({ success: true, sandbox });
    })
  );

  router.get(
    '/sandboxes/:sandboxId/features/:featureId',
    asyncHandler(async (req, res) => {
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid feature ID' });
      }

      const detail = await getFeatureDetail(sandboxId, featureId);
      if (!detail) {
        return res
          .status(404)
          .json({ success: false, error: 'Feature not found' });
      }
      res.json({ success: true, ...detail });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/approve',
    asyncHandler(async (req, res) => {
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid feature ID' });
      }

      const feature = await approveFeature(sandboxId, featureId);
      if (!feature) {
        return res
          .status(404)
          .json({ success: false, error: 'Sandbox or feature not found' });
      }
      res.json({ success: true, message: 'Feature approved', feature });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/reject',
    asyncHandler(async (req, res) => {
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid feature ID' });
      }

      const feature = await rejectFeature(sandboxId, featureId);
      if (!feature) {
        return res
          .status(404)
          .json({ success: false, error: 'Sandbox or feature not found' });
      }
      res.json({ success: true, message: 'Feature rejected', feature });
    })
  );

  router.post(
    '/sandboxes/:sandboxId/features/:featureId/test',
    asyncHandler(async (req, res) => {
      const { sandboxId, featureId } = req.params;
      if (typeof sandboxId !== 'string' || !sandboxId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid sandbox ID' });
      }
      if (typeof featureId !== 'string' || !featureId) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid feature ID' });
      }
      const inputTestType =
        req.body && typeof req.body.testType === 'string'
          ? req.body.testType
          : 'unit';
      const validTestTypes = new Set([
        'unit',
        'integration',
        'user_acceptance',
      ]);
      if (!validTestTypes.has(inputTestType)) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid test type' });
      }

      const result = await testFeature(
        sandboxId,
        featureId,
        inputTestType as 'unit' | 'integration' | 'user_acceptance'
      );
      const sandbox = getSandbox(sandboxId);
      const feature = sandbox?.features.find((f) => f.id === featureId);
      res.json({
        success: true,
        result,
        feature,
      });
    })
  );

  // Mount routes
  app.use('/api', router);
}
