import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Task queue API', () => {
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

  it('returns next task for an assignee and supports submit', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Work queue project',
        taskType: 'text'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Queue Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Queue task',
        inputPayload: { question: 'Q1' }
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({ assigneeId: 'annotator-queue' })
      .expect(201);

    const nextTask = await request(app.getHttpServer())
      .get('/tasks/queue/next')
      .query({ assigneeId: 'annotator-queue' })
      .expect(200);

    expect(nextTask.body.id).toBe(task.body.id);

    const submitted = await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/submit`)
      .send({
        assigneeId: 'annotator-queue',
        outputPayload: { answer: '已提交' }
      })
      .expect(201);

    expect(submitted.body.status).toBe('submitted');
  });
});
