import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Deliveries API', () => {
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

  it('creates a batch delivery and marks the batch delivered', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Delivery Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Delivery Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Reviewed task',
        status: 'qa_passed',
        inputPayload: { question: 'Reviewed?' }
      })
      .expect(201);

    expect(task.body.status).toBe('qa_passed');

    const response = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/deliveries`)
      .send({
        submittedBy: 'ops-1',
        notes: 'first delivery'
      })
      .expect(201);

    expect(response.body.batchId).toBe(batch.body.id);

    const updatedBatch = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}`)
      .expect(200);

    expect(updatedBatch.body.status).toBe('delivered');
  });
});
