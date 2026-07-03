import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Settlements API', () => {
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

  it('creates a split settlement for transferred assignments', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Settlement Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Settlement Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Settlement task',
        inputPayload: { prompt: 'Settle me' }
      })
      .expect(201);

    const originalAssignment = await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({
        operatorId: 'operator-1',
        assigneeId: 'annotator-1'
      })
      .expect(201);

    const transferredAssignment = await request(app.getHttpServer())
      .post(`/assignments/${originalAssignment.body.id}/transfer`)
      .send({
        nextAssigneeId: 'annotator-2',
        transferReason: 'offboarded',
        notes: 'owner left project'
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/settlement`)
      .send({
        decisionMode: 'split',
        decidedBy: 'ops-1',
        shares: [
          { assignmentId: originalAssignment.body.id, percentage: 40 },
          { assignmentId: transferredAssignment.body.id, percentage: 60 }
        ]
      })
      .expect(201);

    expect(response.body.decisionMode).toBe('split');
  });
});
