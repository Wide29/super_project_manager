import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Task import API', () => {
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

  it('imports multiple tasks for a batch', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Import project', taskType: 'text' })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Import batch' })
      .expect(201);

    const imported = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks/import`)
      .send({
        tasks: [
          { title: '题目一', inputPayload: { question: 'Q1' }, priority: 1 },
          { title: '题目二', inputPayload: { question: 'Q2' }, priority: 2 }
        ]
      })
      .expect(201);

    expect(imported.body.createdCount).toBe(2);
    expect(imported.body.tasks).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        title: '题目一'
      }),
      expect.objectContaining({
        id: expect.any(String),
        title: '题目二'
      })
    ]);

    const tasks = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/tasks`)
      .expect(200);

    expect(tasks.body).toHaveLength(2);
  });

  it('rejects invalid import payloads with validation feedback', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Invalid import project', taskType: 'text' })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Invalid import batch' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks/import`)
      .send({
        tasks: [{ title: '', inputPayload: 'not-an-object', priority: -1 }]
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'tasks.0.title should not be empty',
        'tasks.0.inputPayload must be an object',
        'tasks.0.priority must not be less than 0'
      ])
    );
  });

  it('returns 404 when importing into a missing batch', async () => {
    const response = await request(app.getHttpServer())
      .post('/batches/missing-batch/tasks/import')
      .send({
        tasks: [{ title: 'Orphan task', inputPayload: { question: 'Q1' } }]
      })
      .expect(404);

    expect(response.body.message).toBe('Batch missing-batch not found');
  });
});
