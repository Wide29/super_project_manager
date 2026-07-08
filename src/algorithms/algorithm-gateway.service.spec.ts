import { AlgorithmGatewayService } from './algorithm-gateway.service';

type MockPrisma = {
  taskItem: { findUnique: jest.Mock };
  batch: { findUnique: jest.Mock };
  algorithmRuleConfig: { findFirst: jest.Mock };
  taskAssignment: { findMany: jest.Mock };
  taskMatchingRecommendation: { create: jest.Mock };
  taskRiskScore: { create: jest.Mock };
  workerRiskScore: { create: jest.Mock };
  batchSamplingPlan: { create: jest.Mock };
  algorithmInvocationLog: { create: jest.Mock };
};

function createMockPrisma(): MockPrisma {
  return {
    taskItem: { findUnique: jest.fn() },
    batch: { findUnique: jest.fn() },
    algorithmRuleConfig: { findFirst: jest.fn() },
    taskAssignment: { findMany: jest.fn() },
    taskMatchingRecommendation: { create: jest.fn() },
    taskRiskScore: { create: jest.fn() },
    workerRiskScore: { create: jest.fn() },
    batchSamplingPlan: { create: jest.fn() },
    algorithmInvocationLog: { create: jest.fn() }
  };
}

describe('AlgorithmGatewayService python integration', () => {
  const originalPythonUrl = process.env.PYTHON_ALGORITHM_SERVICE_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.PYTHON_ALGORITHM_SERVICE_URL = originalPythonUrl;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls python matching service and maps its response into the existing shape', async () => {
    process.env.PYTHON_ALGORITHM_SERVICE_URL = 'http://python-service:8001';
    const prisma = createMockPrisma();
    prisma.taskItem.findUnique.mockResolvedValue({
      id: 'task-1',
      batchId: 'batch-1',
      batch: {
        id: 'batch-1',
        projectId: 'project-1',
        project: { id: 'project-1' }
      },
      assignments: []
    });
    prisma.taskMatchingRecommendation.create.mockResolvedValue({});
    prisma.algorithmInvocationLog.create.mockResolvedValue({});

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        request_id: 'python-request-1',
        service: 'matching',
        service_version: 'v1',
        rule_version: 'matching_rules_v1',
        feature_version: 'matching_feature_v1',
        result: {
          recommendations: [
            {
              worker_id: 'worker-b',
              rank: 1,
              score: 111.5,
              reasons: ['recent_pass_rate_high'],
              warnings: []
            }
          ]
        },
        reasons: [],
        warnings: [],
        debug: {}
      })
    }) as typeof fetch;

    const service = new AlgorithmGatewayService(prisma as never);

    const response = await service.recommendTaskWorkers({
      projectId: 'project-1',
      batchId: 'batch-1',
      taskId: 'task-1',
      taskType: 'judge',
      mediaType: 'text',
      topK: 2,
      candidateWorkerIds: ['worker-a', 'worker-b'],
      context: {
        isRework: true,
        originalWorkerId: 'worker-b'
      }
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://python-service:8001/api/v1/matching/recommend-task-workers',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: 'task-1',
          project_id: 'project-1',
          batch_id: 'batch-1',
          candidate_worker_ids: ['worker-a', 'worker-b'],
          top_k: 2,
          context: {
            is_rework: true,
            original_worker_id: 'worker-b'
          }
        })
      })
    );
    expect(response).toEqual({
      requestId: 'python-request-1',
      modelVersion: 'python-service-v1',
      ruleVersion: 'matching_rules_v1',
      featureVersion: 'matching_feature_v1',
      recommendations: [
        {
          workerId: 'worker-b',
          rank: 1,
          score: 111.5,
          reasons: ['recent_pass_rate_high'],
          warnings: []
        }
      ]
    });
  });

  it('calls python task-risk service with derived context and maps the response', async () => {
    process.env.PYTHON_ALGORITHM_SERVICE_URL = 'http://python-service:8001';
    const prisma = createMockPrisma();
    prisma.taskItem.findUnique.mockResolvedValue({
      id: 'task-9',
      priority: 8,
      status: 'qa_rejected',
      assignments: [{ id: 'a-1' }, { id: 'a-2' }],
      reviews: [{ decision: 'rejected', stage: 'qa' }, { decision: 'passed', stage: 'qa' }],
      batch: { id: 'batch-9', projectId: 'project-9' }
    });
    prisma.taskRiskScore.create.mockResolvedValue({});
    prisma.algorithmInvocationLog.create.mockResolvedValue({});

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        request_id: 'python-task-risk-1',
        service: 'risk',
        service_version: 'v1',
        rule_version: 'task_risk_rules_v1',
        feature_version: 'task_risk_feature_v1',
        result: {
          risk_score: 88,
          risk_level: 'high',
          reason_codes: ['historical_defect_high', 'deadline_pressure']
        },
        reasons: [],
        warnings: [],
        debug: {}
      })
    }) as typeof fetch;

    const service = new AlgorithmGatewayService(prisma as never);

    const response = await service.scoreTaskRisk({
      taskId: 'task-9',
      projectId: 'project-9'
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://python-service:8001/api/v1/risk/task-score',
      expect.objectContaining({
        body: JSON.stringify({
          task_id: 'task-9',
          project_id: 'project-9',
          context: {
            rework_count: 1,
            deadline_hours_left: 4,
            historical_defect_rate: 0.5
          }
        })
      })
    );
    expect(response).toEqual({
      requestId: 'python-task-risk-1',
      taskId: 'task-9',
      riskScore: 88,
      riskLevel: 'high',
      reasons: ['historical_defect_high', 'deadline_pressure'],
      modelVersion: 'python-service-v1',
      featureVersion: 'task_risk_feature_v1',
      ruleVersion: 'task_risk_rules_v1'
    });
  });

  it('falls back to the local matching logic when the python service fails', async () => {
    process.env.PYTHON_ALGORITHM_SERVICE_URL = 'http://python-service:8001';
    const prisma = createMockPrisma();
    prisma.taskItem.findUnique.mockResolvedValue({
      id: 'task-3',
      batchId: 'batch-3',
      batch: {
        id: 'batch-3',
        projectId: 'project-3',
        project: { id: 'project-3' }
      },
      assignments: []
    });
    prisma.algorithmRuleConfig.findFirst.mockResolvedValue({
      ruleVersion: 'matching_rule_local'
    });
    prisma.taskAssignment.findMany.mockResolvedValue([{ assigneeId: 'worker-b' }]);
    prisma.taskMatchingRecommendation.create.mockResolvedValue({});
    prisma.algorithmInvocationLog.create.mockResolvedValue({});

    global.fetch = jest.fn().mockRejectedValue(new Error('python unavailable')) as typeof fetch;

    const service = new AlgorithmGatewayService(prisma as never);

    const response = await service.recommendTaskWorkers({
      projectId: 'project-3',
      batchId: 'batch-3',
      taskId: 'task-3',
      taskType: 'judge',
      mediaType: 'text',
      topK: 2,
      candidateWorkerIds: ['worker-a', 'worker-b'],
      context: {
        isRework: true,
        originalWorkerId: 'worker-b'
      }
    });

    expect(response.requestId).toBeDefined();
    expect(response.ruleVersion).toBe('matching_rule_local');
    expect(response.recommendations[0].workerId).toBe('worker-b');
    expect(prisma.algorithmInvocationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'fallback',
          fallbackUsed: true
        })
      })
    );
  });
});
