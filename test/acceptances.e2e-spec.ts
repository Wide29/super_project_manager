import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Acceptances API', () => {
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

  it('accepts a delivery with partial rejection and creates sampling reviews', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Acceptance Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Acceptance Batch' })
      .expect(201);

    const createdTaskIds: string[] = [];
    for (const title of ['Task A', 'Task B']) {
      const task = await request(app.getHttpServer())
        .post(`/batches/${batch.body.id}/tasks`)
        .send({
          title,
          status: 'qa_passed',
          inputPayload: { title }
        })
        .expect(201);
      createdTaskIds.push(task.body.id);
    }

    const delivery = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/deliveries`)
      .send({
        submittedBy: 'ops-1',
        notes: 'delivery for acceptance'
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/deliveries/${delivery.body.id}/acceptances`)
      .send({
        reviewedBy: 'algo-1',
        decision: 'partially_rejected',
        sampleSize: 2,
        sampledTaskIds: createdTaskIds,
        rejectedTaskIds: [createdTaskIds[0]]
      })
      .expect(201);

    expect(response.body.decision).toBe('partially_rejected');
  });
});
