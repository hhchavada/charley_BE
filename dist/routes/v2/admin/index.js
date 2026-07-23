"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GrantAdminController_1 = require("../../../controllers/v2/admin/GrantAdminController");
const router = (0, express_1.Router)();
// Grant Routes
router.get('/grants', GrantAdminController_1.GrantAdminController.listGrants);
router.get('/grants/:id', GrantAdminController_1.GrantAdminController.getGrant);
router.post('/grants', GrantAdminController_1.GrantAdminController.createGrant);
router.put('/grants/:id', GrantAdminController_1.GrantAdminController.updateGrant);
router.delete('/grants/:id', GrantAdminController_1.GrantAdminController.deleteGrant);
router.post('/grants/:id/clone', GrantAdminController_1.GrantAdminController.cloneGrant);
// Other routes will follow similar patterns for Rules, Questions, etc.
exports.default = router;
