import { Router, type Express } from 'express';
import { 
  getAllSandboxes, 
  getSandbox, 
  createSandbox,
  addFeatureToSandbox,
  testFeature 
} from '../sandboxEnvironmentService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Sandbox and Feature Management Routes
 */
export function registerSandboxRoutes(app: Express) {
  const router = Router();

  // Get all sandboxes
  router.get('/sandboxes', asyncHandler(async (req, res) => {
    const sandboxes = await getAllSandboxes();
    res.json({ success: true, sandboxes });
  }));

  // Create a new sandbox
  router.post('/sandboxes', asyncHandler(async (req, res) => {
    const { name, description, createdBy = 'user' } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const sandbox = await createSandbox({
      name,
      description,
      createdBy: createdBy as 'milla' | 'user'
    });

    res.json({ success: true, sandbox });
  }));

  // Get specific sandbox details
  router.get('/sandboxes/:sandboxId', asyncHandler(async (req, res) => {
    const sandbox = getSandbox(req.params.sandboxId);

    if (!sandbox) {
      return res.status(404).json({ error: 'Sandbox not found' });
    }

    res.json({ success: true, sandbox });
  }));

  // Add a feature to a sandbox
  router.post('/sandboxes/:sandboxId/features', asyncHandler(async (req, res) => {
    const { name, description, files = [] } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const feature = await addFeatureToSandbox(req.params.sandboxId, {
      name,
      description,
      files
    });

    if (!feature) {
      return res.status(404).json({ error: 'Sandbox not found' });
    }

    res.json({ success: true, feature });
  }));

  router.post('/sandboxes/:sandboxId/features/:featureId/approve', asyncHandler(async (req, res) => {
    // Implementation for approval logic (likely in sandbox service)
    res.json({ success: true, message: 'Feature approved' });
  }));

  router.post('/sandboxes/:sandboxId/features/:featureId/test', asyncHandler(async (req, res) => {
    // testType defaults to 'unit' if not specified
    const testType = req.body.testType || 'unit';
    const result = await testFeature(req.params.sandboxId, req.params.featureId, testType);
    res.json(result);
  }));

  // Mount routes
  app.use('/api', router);
}
