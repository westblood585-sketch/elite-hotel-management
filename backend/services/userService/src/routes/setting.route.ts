
import express from 'express';
import { settingController } from '../config/container';
import authenticateToken from '../middleware/auth.middleware'
import { authorizeRole } from '../middleware/authorizeRole'

const router = express.Router();

// Get settings (optionally filter by category)
router.get(
  '/',
  authenticateToken,
  authorizeRole(['admin']),
  settingController.getSettings.bind(settingController)
);

// Update a specific setting
router.put(
  '/:key',
  authenticateToken,
  authorizeRole(['admin']),
  settingController.updateSetting.bind(settingController)
);

// Initialize defaults (admin only utility)
router.post(
  '/seed',
  authenticateToken,
  authorizeRole(['admin']),
  settingController.seedDefaults.bind(settingController)
);

export default router;
