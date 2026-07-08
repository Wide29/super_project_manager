import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Algorithms API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates rule configs and persists recommendation/risk snapshots', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Algorithm Parent',
        taskType: 'agent_judge'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/algorithms/rule-configs')
      .send({
        projectId: project.body.id,
        ruleType: 'matching',
        ruleVersion: 'matching_rule_v1',
        name: 'Project Matching Config',
        config: {
          maxLoad: 3,
          preferOriginalWorkerOnRework: true
        },
        status: 'active'
      })
      .expect(201);

    const configs = await request(app.getHttpServer())
      .get('/algorithms/rule-configs')
      .query({ projectId: project.body.id, ruleType: 'matching' })
      .expect(200);

    expect(configs.body).toHaveLength(1);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Algorithm Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Judge the agent answer',
        priority: 8,
        inputPayload: { question: 'What is a safe answer?' }
      })
      .expect(201);

    const recommendation = await request(app.getHttpServer())
      .post('/internal/algorithm/matching/recommend-task-workers')
      .send({
        projectId: project.body.id,
        batchId: batch.body.id,
        taskId: task.body.id,
        taskType: 'agent_judge',
        mediaType: 'text',
        topK: 3,
        candidateWorkerIds: ['algo-annotator-1', 'algo-annotator-2'],
        context: {
          isRework: true,
          originalWorkerId: 'algo-annotator-2'
        }
      })
      .expect(201);

    expect(recommendation.body.recommendations[0].workerId).toBe('algo-annotator-2');

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({
        operatorId: 'operator-1',
        assigneeId: 'algo-annotator-2',
        recommendationRequestId: recommendation.body.requestId,
        selectedByUserId: 'operator-1',
        selectionSource: 'recommended'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/submit`)
      .send({
        assigneeId: 'algo-annotator-2',
        outputPayload: {
          answer: 'safe output'
        }
      })
      .expect(201);

    const snapshots = await request(app.getHttpServer())
      .get(`/tasks/${task.body.id}/algorithm-snapshots`)
      .expect(200);

    expect(snapshots.body.recommendations).toHaveLength(1);
    expect(snapshots.body.recommendations[0].selectedWorkerId).toBe('algo-annotator-2');
    expect(snapshots.body.riskScores).toHaveLength(1);
    expect(snapshots.body.invocationLogs.length).toBeGreaterThanOrEqual(2);
  });
});
