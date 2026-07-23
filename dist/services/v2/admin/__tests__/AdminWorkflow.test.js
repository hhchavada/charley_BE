"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigurationValidationService_1 = require("../ConfigurationValidationService");
const ConfigurationPublishService_1 = require("../ConfigurationPublishService");
const RollbackService_1 = require("../RollbackService");
const GrantManagementService_1 = require("../GrantManagementService");
describe('Admin Configuration Workflow', () => {
    let auditMock;
    let repoMock;
    let versionMock;
    beforeEach(() => {
        auditMock = { log: jest.fn().mockResolvedValue(undefined) };
        repoMock = {
            create: jest.fn().mockImplementation(data => Promise.resolve({ id: '123', ...data })),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn()
        };
        versionMock = {
            createVersionSnapshot: jest.fn().mockResolvedValue('v2'),
            setActiveVersion: jest.fn().mockResolvedValue(undefined),
            getActiveVersion: jest.fn().mockResolvedValue('v1'),
            getDraftVersion: jest.fn()
        };
    });
    describe('GrantManagementService', () => {
        it('creates draft grant and logs audit', async () => {
            const service = new GrantManagementService_1.GrantManagementService(repoMock, auditMock);
            const result = await service.createDraftGrant({ name: 'Test' }, 'admin1');
            expect(result.status).toBe('DRAFT');
            expect(repoMock.create).toHaveBeenCalled();
            expect(auditMock.log).toHaveBeenCalledWith('CREATE', 'GRANT', '123', expect.any(Object), 'admin1');
        });
    });
    describe('ConfigurationValidationService', () => {
        it('detects broken rule references', async () => {
            const validator = new ConfigurationValidationService_1.ConfigurationValidationService();
            const rules = [{ id: 'r1', questionId: 'q999' }]; // q999 does not exist
            const groups = [{ id: 'g1', ruleIds: ['r999'] }]; // r999 does not exist
            const { isValid, report } = await validator.validateDraft([], rules, groups, []);
            expect(isValid).toBe(false);
            expect(report.length).toBe(2);
            expect(report.some(r => r.includes('missing Question q999'))).toBe(true);
            expect(report.some(r => r.includes('missing Rule r999'))).toBe(true);
        });
        it('detects excessive nesting (circular reference heuristic)', async () => {
            const validator = new ConfigurationValidationService_1.ConfigurationValidationService();
            // Creating a chain of 15 nested groups
            const groups = Array.from({ length: 15 }, (_, i) => ({
                id: `g${i}`,
                nestedGroupIds: i < 14 ? [`g${i + 1}`] : []
            }));
            const { isValid, report } = await validator.validateDraft([], [], groups, []);
            expect(isValid).toBe(false);
            expect(report.some(r => r.includes('exceeds max nesting depth'))).toBe(true);
        });
    });
    describe('ConfigurationPublishService', () => {
        it('aborts publish if validation fails', async () => {
            const validator = new ConfigurationValidationService_1.ConfigurationValidationService();
            const service = new ConfigurationPublishService_1.ConfigurationPublishService(versionMock, validator, auditMock);
            versionMock.getDraftVersion.mockResolvedValue({
                grants: [], rules: [], ruleGroups: [{ id: 'g1', ruleIds: ['broken'] }], questions: []
            });
            await expect(service.publishDraft('admin1')).rejects.toThrow('Publish failed due to validation errors');
            expect(versionMock.createVersionSnapshot).not.toHaveBeenCalled();
        });
        it('publishes and logs audit if validation passes', async () => {
            const validator = new ConfigurationValidationService_1.ConfigurationValidationService();
            const service = new ConfigurationPublishService_1.ConfigurationPublishService(versionMock, validator, auditMock);
            versionMock.getDraftVersion.mockResolvedValue({ grants: [], rules: [], ruleGroups: [], questions: [] });
            const versionId = await service.publishDraft('admin1');
            expect(versionId).toBe('v2');
            expect(versionMock.setActiveVersion).toHaveBeenCalledWith('v2');
            expect(auditMock.log).toHaveBeenCalledWith('PUBLISH', 'SYSTEM_VERSION', 'v2', expect.any(Object), 'admin1');
        });
    });
    describe('RollbackService', () => {
        it('rolls back to previous version and logs audit', async () => {
            const service = new RollbackService_1.RollbackService(versionMock, auditMock);
            await service.rollback('v_old', 'admin1', 'Bad publish');
            expect(versionMock.setActiveVersion).toHaveBeenCalledWith('v_old');
            expect(auditMock.log).toHaveBeenCalledWith('ROLLBACK', 'SYSTEM_VERSION', 'v_old', expect.any(Object), 'admin1');
        });
        it('prevents rollback to current version', async () => {
            const service = new RollbackService_1.RollbackService(versionMock, auditMock);
            await expect(service.rollback('v1', 'admin1', 'Test')).rejects.toThrow('already running on version v1');
        });
    });
});
