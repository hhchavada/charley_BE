import { Router } from 'express';
import { GrantAdminController } from '../../../controllers/v2/admin/GrantAdminController';

const router = Router();

// Grant Routes
router.get('/grants', GrantAdminController.listGrants);
router.get('/grants/:id', GrantAdminController.getGrant);
router.post('/grants', GrantAdminController.createGrant);
router.put('/grants/:id', GrantAdminController.updateGrant);
router.delete('/grants/:id', GrantAdminController.deleteGrant);
router.post('/grants/:id/clone', GrantAdminController.cloneGrant);

// Other routes will follow similar patterns for Rules, Questions, etc.

export default router;
