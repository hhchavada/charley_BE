"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventCollector_1 = require("../EventCollector");
const FunnelAnalytics_1 = require("../FunnelAnalytics");
const PerformanceAnalytics_1 = require("../PerformanceAnalytics");
describe('Enterprise Analytics Layer', () => {
    let mockRepo;
    let mockProvider;
    beforeEach(() => {
        mockRepo = {
            save: jest.fn().mockResolvedValue(undefined),
            findEvents: jest.fn()
        };
        mockProvider = {
            sendMetric: jest.fn().mockResolvedValue(undefined)
        };
    });
    describe('EventCollector', () => {
        it('dispatches event to repository and providers statelessly', async () => {
            const collector = new EventCollector_1.EventCollector(mockRepo, [mockProvider]);
            await collector.dispatch({
                eventType: 'SESSION_STARTED',
                versionId: 'v1',
                payload: { userId: '123' }
            });
            expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                eventType: 'SESSION_STARTED',
                versionId: 'v1'
            }));
            expect(mockProvider.sendMetric).toHaveBeenCalledWith('grant_engine.session_started', 1, { versionId: 'v1' });
        });
    });
    describe('FunnelAnalytics', () => {
        it('calculates conversion and drop rates correctly', async () => {
            const mockEvents = [
                { eventId: '1', timestamp: new Date(), eventType: 'SESSION_STARTED', versionId: 'v1', payload: {} },
                { eventId: '2', timestamp: new Date(), eventType: 'SESSION_STARTED', versionId: 'v1', payload: {} },
                { eventId: '3', timestamp: new Date(), eventType: 'ASSESSMENT_COMPLETED', versionId: 'v1', payload: {} },
                { eventId: '4', timestamp: new Date(), eventType: 'ASSESSMENT_DROPPED', versionId: 'v1', payload: {} }
            ];
            mockRepo.findEvents.mockResolvedValue(mockEvents);
            const funnel = new FunnelAnalytics_1.FunnelAnalytics(mockRepo);
            const metrics = await funnel.getFunnelMetrics('v1');
            expect(metrics.sessionStarted).toBe(2);
            expect(metrics.completed).toBe(1);
            expect(metrics.dropped).toBe(1);
            expect(metrics.completionRate).toBe(50);
            expect(metrics.dropRate).toBe(50);
        });
    });
    describe('PerformanceAnalytics', () => {
        it('calculates P95 and P99 latencies correctly', async () => {
            // Create 100 fake evaluation events from 1ms to 100ms
            const mockEvents = Array.from({ length: 100 }, (_, i) => ({
                eventId: `${i}`, timestamp: new Date(), eventType: 'EVALUATION_PERFORMANCE', versionId: 'v1',
                payload: { executionTimeMs: i + 1 }
            }));
            mockRepo.findEvents.mockResolvedValue(mockEvents);
            const perf = new PerformanceAnalytics_1.PerformanceAnalytics(mockRepo);
            const metrics = await perf.getLatencyMetrics('v1');
            expect(metrics?.totalEvaluations).toBe(100);
            expect(metrics?.averageLatencyMs).toBe(50.5); // (1+100)/2
            expect(metrics?.p95LatencyMs).toBe(96); // index 95 is 96
            expect(metrics?.p99LatencyMs).toBe(100); // index 99 is 100
            expect(metrics?.slowest).toBe(100);
        });
    });
});
