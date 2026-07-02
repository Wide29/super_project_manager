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

    const tasks = await request(app.getHttpServer())
      .get(`/batches/${batch.body.id}/tasks`)
      .expect(200);

    expect(tasks.body).toHaveLength(2);
  });
});
