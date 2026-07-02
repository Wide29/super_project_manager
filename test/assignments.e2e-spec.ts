import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Assignments API', () => {
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

  it('creates and lists assignments for a task', async () => {
    const project = await request(app.getHttpServer())
      .post('/projects')
      .send({
        name: 'Assignment Parent',
        taskType: 'judge'
      })
      .expect(201);

    const batch = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/batches`)
      .send({ name: 'Batch Assign' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/batches/${batch.body.id}/tasks`)
      .send({
        title: 'Judge answer quality',
        inputPayload: { question: 'Why?' }
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.body.id}/assignments`)
      .send({
        operatorId: 'operator-1',
        assigneeId: 'annotator-1',
        notes: 'First assignment'
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/tasks/${task.body.id}/assignments`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].assigneeId).toBe('annotator-1');
  });
});
