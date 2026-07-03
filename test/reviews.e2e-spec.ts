import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Reviews API', () => {
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

  it('creates a QA review and updates task status', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Review Project',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Review Batch' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Review task',
        inputPayload: { question: 'Why?' }
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/reviews`)
      .send({
        stage: 'qa',
        decision: 'passed',
        reviewerId: 'qa-1'
      })
      .expect(201);

    expect(response.body.stage).toBe('qa');
    expect(response.body.decision).toBe('passed');

    const updatedTask = await request(app.getHttpServer())
      .get(`/tasks/${task.body.id}`)
      .expect(200);

    expect(updatedTask.body.status).toBe('qa_passed');
  });
});
