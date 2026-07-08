import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Algorithm Risk & Sampling', () => {
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

  it('creates worker risk snapshots after QA review', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Worker Risk Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Worker Risk Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Risk review task',
        inputPayload: { question: 'Need QA' }
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({
        operatorId: 'ops-risk',
        assigneeId: 'worker-risk-1'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/submit`)
      .send({
        assigneeId: 'worker-risk-1',
        outputPayload: {
          answer: 'initial output'
        }
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/reviews`)
      .send({
        stage: 'qa',
        decision: 'rejected',
        reviewerId: 'qa-risk-1',
        notes: 'quality issue found'
      })
      .expect(201);

    const workerSnapshots = await request(app.getHttpServer())
      .get('/workers/worker-risk-1/algorithm-snapshots')
      .expect(200);

    expect(workerSnapshots.body.riskScores.length).toBeGreaterThanOrEqual(1);
    expect(workerSnapshots.body.riskScores[0].workerId).toBe('worker-risk-1');
    expect(workerSnapshots.body.invocationLogs[0].route).toBe('risk/worker-score');
  });

  it('creates batch sampling plans after delivery', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Sampling Plan Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Sampling Plan Batch' })
      .expect(201);

    const highPriorityTask = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'High risk task',
        priority: 9,
        status: 'qa_passed',
        inputPayload: { question: 'Hard question' }
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/internal/algorithm/risk/task-score')
      .send({
        taskId: highPriorityTask.body.id,
        projectId: project.body.id,
        batchId: batch.body.id
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/deliveries`)
      .send({
        submittedBy: 'ops-sampling-1'
      })
      .expect(201);

    const batchSnapshots = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/algorithm-snapshots`)
      .expect(200);

    expect(batchSnapshots.body.samplingPlans.length).toBeGreaterThanOrEqual(1);
    expect(batchSnapshots.body.samplingPlans[0].batchId).toBe(batch.body.id);
    expect(batchSnapshots.body.samplingPlans[0].recommendedCount).toBeGreaterThan(0);
    expect(batchSnapshots.body.invocationLogs[0].route).toBe('sampling/batch-plan');
  });
});
